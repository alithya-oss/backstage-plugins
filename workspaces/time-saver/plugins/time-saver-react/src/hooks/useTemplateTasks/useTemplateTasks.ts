import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  TimeSaverApiErrorResponse,
  isTimeSaverApiError,
} from '@alithya-oss/backstage-plugin-time-saver-common';

/**
 * Retrieves a template tasks list from the backend.
 *
 * @public
 */
export function useTemplateTasks(): {
  items?: string[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTemplateTasks();
    if (!isTimeSaverApiError(result)) {
      return result.templateTasks;
    }
    return result;
  }, [api]);

  return {
    items: value,
    loading,
    error,
  };
}
