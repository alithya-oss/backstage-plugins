import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api';
import useAsync from 'react-use/esm/useAsync';
import {
  GetUriParams,
  isTimeSaverApiError,
  TimeSavedStatistics,
  TimeSavedStatisticsByTeamName,
  TimeSavedStatisticsByTemplateName,
  TimeSaverApiErrorResponse,
} from '@alithya-oss/backstage-plugin-time-saver-common';

/**
 * Retrieves time-saved statistics from the backend.
 *
 * @public
 */
export function useStatistics(params?: GetUriParams): {
  items?:
    | TimeSavedStatistics[]
    | TimeSavedStatisticsByTeamName[]
    | TimeSavedStatisticsByTemplateName[]
    | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getStatistics(params);
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
