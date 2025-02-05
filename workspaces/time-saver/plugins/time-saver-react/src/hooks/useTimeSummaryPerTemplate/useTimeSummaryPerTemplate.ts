import { useApi } from '@backstage/core-plugin-api';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
  TimeSummaryByTemplateName,
} from '@alithya-oss/backstage-plugin-time-saver-common';

/**
 * Retrieves time-saved per template from the backend.
 *
 * @public
 */
export function useTimeSummaryPerTemplate(): {
  items?: TimeSummaryByTemplateName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getTimeSummaryPerTemplate();
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
