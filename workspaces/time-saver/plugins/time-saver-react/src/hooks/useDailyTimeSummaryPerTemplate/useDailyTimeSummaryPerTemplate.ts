import { useApi } from '@backstage/core-plugin-api';
import {
  isTimeSaverApiError,
  TimeSaverApiErrorResponse,
  TimeSummaryByTemplateName,
} from '@alithya-oss/backstage-plugin-time-saver-common';
import { timeSaverApiRef } from '../../api/TimeSaverApi';
import useAsync from 'react-use/esm/useAsync';

/**
 * Retrieves a daily time-saved summary per template from the backend.
 *
 * @public
 */
export function useDailyTimeSummaryPerTemplate(): {
  items?: TimeSummaryByTemplateName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
} {
  const api = useApi(timeSaverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const result = await api.getDailyTimeSummaryPerTemplate();
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
