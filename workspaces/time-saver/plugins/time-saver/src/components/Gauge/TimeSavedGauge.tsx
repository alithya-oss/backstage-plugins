/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useEffect, useState } from 'react';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import CircularProgress from '@material-ui/core/CircularProgress';
import Gauge from './Gauge';
import {
  GetTimeSavedSumResponse,
  isTimeSaverApiError,
} from '@alithya-oss/plugin-time-saver-common';

interface TimeSavedGaugeProps {
  number?: number;
  heading: string;
}

export function TimeSavedGauge({
  number,
  heading,
}: TimeSavedGaugeProps): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [data, setData] = useState<GetTimeSavedSumResponse | null>(null);

  useEffect(() => {
    let url = `${configApi.getString(
      'backend.baseUrl',
    )}/api/time-saver/getTimeSavedSum`;
    if (number) {
      url = `${url}?divider=${number}`;
    }

    fetchApi
      .fetch(url)
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi, number, fetchApi]);

  if (!data) {
    return <CircularProgress />;
  }

  if (isTimeSaverApiError(data)) {
    return <>{data.errorMessage}</>;
  }

  const roundedData = Math.round(data.timeSaved);

  return <Gauge number={roundedData} heading={heading} />;
}
