import React from 'react';
import { SelectorTemplate } from '../SelectorTemplate';
import { useTeams } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import { CircularProgress } from '@material-ui/core';

/**
 * Props for {@link TeamSelector}.
 *
 * @public
 */
export interface TeamSelectorProps {
  onTeamChange: (team: string) => void;
  onClearButtonClick?: () => void;
}

/**
 * Displays a selector component with a list of teams.
 *
 * @public
 */
const TeamSelector = (props: TeamSelectorProps) => {
  const apiResult = useTeams();
  const { loading, error, items } = apiResult;

  const [team, setTeam] = React.useState('');

  const handleChange = (
    event: React.ChangeEvent<{
      name?: string | undefined;
      value: unknown;
    }>,
  ) => {
    const selectedTeam = event.target.value as string;
    setTeam(selectedTeam);
    props.onTeamChange(selectedTeam);
  };

  const handleClearClick = () => {
    setTeam('');
    props.onClearButtonClick?.();
  };

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    return (
      <SelectorTemplate
        defaultValue={team}
        label="Team"
        items={items}
        handleChange={handleChange}
        handleClearClick={handleClearClick}
      />
    );
  }

  return (
    <>
      <>{loading && <CircularProgress />}</>
      <>{error ? `Error: ${apiResult.error}` : ''}</>
    </>
  );
};
export default TeamSelector;
