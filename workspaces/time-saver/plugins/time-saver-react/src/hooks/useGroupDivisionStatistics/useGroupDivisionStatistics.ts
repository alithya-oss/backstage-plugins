import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  GroupSavingsDivision,
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
} from '@alithya-oss/backstage-plugin-time-saver-common';

/**
 * Retrieves time-saved percentages per team from the backend.
 *
 * @public
 */
export function useGroupDivisionStatistics(): {
  items?: GroupSavingsDivision[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getGroupDivisionsStatistics();
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
