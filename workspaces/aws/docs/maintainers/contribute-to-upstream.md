# Contribute to Harmonix upstream

1. Make sure the changes are merged into the **main branch** of this repository.
2. Get a local copy of the `alithya-oss/harmonix` repository.
    - Use the same parent folder than for you local copy of this repository (`alithya-oss/backstage-plugins`).
      repository into the same project folder as your local copy of this repository (`alithya-oss/backstage-plugins`).

```shell
# This Example uses '~/projects/alithya-oss/' as your base project directory
cd ~/projects/alithya-oss
git clone https://github.com/alithya-oss/harmonix
cd harmonix
```

3. Run `build-scripts/backstage-install.sh`, the initialization script for the Harmonix dev environment.
    - This will create a `backstage` subfolder and generate a new Backstage setup in it.
    - It will also apply the patch from the `backstage-mods` folder, which is required for the integration of the
      plugins.

```shell
buid-scripts/backstage-install.sh
```

4. Copy your `.env` and `app-config.local.yaml` files over to this new backstage environment.

```shell
# From the harmonix folder
cp ../backstage-plugins/workspaces/aws/{.env, app-config.local.yaml} bacstage/
```

5. Install the current version of Harmonix plugins in your new Harmonix dev environment.

```shell
rsync -viva ./backstage-plugins/plugins/* ./backstage/plugins/
```

6. Remove the plugins' extra package.json

```shell
rm -vf ./backstage/plugins/package.json
```

7. Install dependencies with yarn

```shell
cd backstage/
yarn install
```

8. Bring forth the changes from `alithya-oss/backstage-plugins` to your new Harmonix dev environment
    - Proceed with only one plugin at a time

```shell
rysnc -viva ../../backstage-plugins/workspaces/aws/plugins/aws-apps ./plugins/
```

9. Update your Harmonix dev environment's `backstage/package.json` file with these scripts and resolutions

```json
{
  "scripts": {
    "dev": "concurrently \"yarn start\" \"yarn start-backend\"",
    "start": "yarn workspace app start",
    "start-backend": "yarn workspace backend start",
    "build:backend": "yarn workspace backend build",
    "build:all": "backstage-cli repo build --all",
    "build:api-reports": "yarn build:api-reports:only --tsc",
    "build:api-reports:only": "backstage-repo-tools api-reports -o ae-wrong-input-file-type --allow-warnings plugins/aws-apps --validate-release-tags",
    "build-image": "yarn workspace backend build-image",
    "tsc": "tsc",
    "tsc:full": "tsc --skipLibCheck false --incremental false",
    "clean": "backstage-cli repo clean",
    "test": "backstage-cli repo test",
    "test:all": "backstage-cli repo test --coverage",
    "test:e2e": "playwright test",
    "fix": "backstage-cli repo fix",
    "lint": "backstage-cli repo lint --since origin/main",
    "lint:all": "backstage-cli repo lint",
    "prettier:check": "prettier --check .",
    "new": "backstage-cli new --scope @alithya-oss",
    "postinstall": "cd ../../ && yarn install"
  }
} 
```

```json
{
  "resolutions": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@microsoft/api-extractor": "7.36.4"
  }
}
```

10. Install dependencies again

```shell
cd backstage/
yarn install
```

11. Bump the versions

```shell
yarn backstage-cli verisons:bump --relase 1.29.0
```