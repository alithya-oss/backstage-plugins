import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
} from '@alithya-oss/plugin-time-saver-common';

/**
 * Retrieves the template count from the backend.
 *
 * @public
 */
export function useTemplateCount(): {
  items?: number | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTemplateCount();
    if (!isTimeSaverApiError(result)) {
      return result.count;
    }
    return result;
  }, [api]);

  return {
    items: value,
    loading,
    error,
  };
}
