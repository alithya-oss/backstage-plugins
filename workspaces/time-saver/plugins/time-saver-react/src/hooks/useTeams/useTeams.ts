import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
} from '@alithya-oss/plugin-time-saver-common';

/**
 * Retrieves a teams list from the backend.
 *
 * @public
 */
export function useTeams(): {
  items?: string[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTeams();
    if (!isTimeSaverApiError(result)) {
      return result.groups;
    }
    return result;
  }, [api]);

  return {
    items: value,
    loading,
    error,
  };
}
