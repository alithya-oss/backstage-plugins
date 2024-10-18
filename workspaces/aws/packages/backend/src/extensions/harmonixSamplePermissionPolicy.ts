import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';
import { readOpaAppAuditPermission } from '@alithya-oss/plugin-aws-apps-common';
import { DEFAULT_NAMESPACE, stringifyEntityRef } from '@backstage/catalog-model';
import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import { catalogConditions, createCatalogConditionalDecision } from '@backstage/plugin-catalog-backend/alpha';
import { RESOURCE_TYPE_CATALOG_ENTITY, catalogEntityDeletePermission, catalogEntityReadPermission } from '@backstage/plugin-catalog-common/alpha';
import { AuthorizeResult, PolicyDecision, isPermission, isResourcePermission } from '@backstage/plugin-permission-common';
import { PermissionPolicy, PolicyQuery } from '@backstage/plugin-permission-node';


// The Group entity ref constants below are based on group identifiers created from the auth IdP or manually created
// Update the entity ref identifiers as appropriate to match your Backstage installation
const ADMINS_GROUP = stringifyEntityRef({ kind: 'Group', namespace: DEFAULT_NAMESPACE, name: "admins" });
const DEVOPS_GROUP = stringifyEntityRef({ kind: 'Group', namespace: DEFAULT_NAMESPACE, name: "dev-ops" });
// const QA_GROUP = stringifyEntityRef({ kind: 'Group', namespace: DEFAULT_NAMESPACE, name: "qa" });
const DEVELOPERS_GROUP = stringifyEntityRef({ kind: 'Group', namespace: DEFAULT_NAMESPACE, name: "developers" });
// const EVERYONE_GROUP = stringifyEntityRef({ kind: 'Group', namespace: DEFAULT_NAMESPACE, name: "everyone" });

// class OpaSampleAllowAllPolicy implements PermissionPolicy {

//   async handle(): Promise<PolicyDecision> {
//     return { result: AuthorizeResult.ALLOW };
//   }
// }

class OpaSamplePermissionPolicy implements PermissionPolicy {

  async handle(
    request: PolicyQuery, 
    user?: BackstageIdentityResponse
  ): Promise<PolicyDecision> {

    // The example permission decision checks follow a "first found" strategy.
    // The order of the checks is very important!!

    // store the array of entityRefs which allow this user to claim ownership of an entity
    const ownershipGroups = user?.identity.ownershipEntityRefs || [];

    // Example permission decision:
    //   ALLOW admin and devops group members to perform any action
    const allowAllGroups = [ADMINS_GROUP, DEVOPS_GROUP];
    if (ownershipGroups.some(x => allowAllGroups.includes(x))) {
      return { result: AuthorizeResult.ALLOW };
    }

    // Example permission decision: 
    //   DENY audit read access unless the user is a member of Admin or DevOps
    //   The implementation below assumes that prior checks have returned an
    //   'allow' policy decision for groups other than 'developer'
    if (isPermission(request.permission, readOpaAppAuditPermission) && ownershipGroups.includes(DEVELOPERS_GROUP)) {
      return { result: AuthorizeResult.DENY };
    }

    // Example permission decision:
    //   Multiple groups of permission decisions are nested under the first check to see if we're working with catalog entities
    if (isResourcePermission(request.permission, RESOURCE_TYPE_CATALOG_ENTITY)) {

      // Example permission decision:
      //   DENY catalog entity delete permission (Unregister entity) to users
      //   if they cannot claim ownership of the entity
      if (isPermission(request.permission, catalogEntityDeletePermission)) {
        return createCatalogConditionalDecision(
          request.permission,
          catalogConditions.isEntityOwner({
            claims: user?.identity.ownershipEntityRefs ?? [],
          }),
        );
      }
      // Example permission decision:
      //   DENY users access to software templates of type 'aws-environment' or
      //   'aws-environment-provider' if they cannot claim ownership of the entity
      if (isPermission(request.permission, catalogEntityReadPermission)) {
        return createCatalogConditionalDecision(request.permission, {
          not: {
            allOf: [
              catalogConditions.isEntityKind({ kinds: ['template'] }),
              {
                anyOf: [
                  catalogConditions.hasSpec({ key: 'type', value: 'aws-environment' }),
                  catalogConditions.hasSpec({ key: 'type', value: 'aws-environment-provider' }),
                ],
              },
            ],
          },
        });
      }
    }

    // Default policy decision is to ALLOW permission requests
    return { result: AuthorizeResult.ALLOW };
  }
}

export default createBackendModule({
  pluginId: 'permission',
  moduleId: 'custom-harmonix-policy',
  register(reg) {
    reg.registerInit({
      deps: { policy: policyExtensionPoint },
      async init({ policy }) {
        policy.setPolicy(new OpaSamplePermissionPolicy());
      },
    });
  },
});