import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
  GetUriParams,
} from '@alithya-oss/plugin-time-saver-common';

/**
 * Retrieves the total time saved from using software templates from the backend.
 *
 * @public
 */
export function useTimeSavedSum(params?: GetUriParams): {
  items?: number | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTimeSavedSum(params);
    if (!isTimeSaverApiError(result)) {
      return result.timeSaved;
    }
    return result;
  }, [api]);

  return {
    items: value,
    loading,
    error,
  };
}
