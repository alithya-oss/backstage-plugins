import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
  TimeSummaryByTeamName,
} from '@alithya-oss/plugin-time-saver-common';

/**
 * Retrieves time-saved per team from the backend.
 *
 * @public
 */
export function useTimeSummaryPerTeam(): {
  items?: TimeSummaryByTeamName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTimeSummaryPerTeam();
    if (!isTimeSaverApiError(result)) {
      return result.stats;
    }
    return result;
  }, [api]);

  return {
    items: value,
    loading,
    error,
  };
}
