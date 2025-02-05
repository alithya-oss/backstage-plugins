import { useApi } from '@backstage/core-plugin-api';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
  TimeSummaryByTeamName,
} from '@alithya-oss/backstage-plugin-time-saver-common';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';

/**
 * Retrieves a daily time-saved summary per team from the backend.
 *
 * @public
 */
export function useDailyTimeSummaryPerTeam(): {
  items?: TimeSummaryByTeamName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getDailyTimeSummaryPerTeam();
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
