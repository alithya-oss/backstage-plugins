/*
 * Copyright 2026 The Alithya Authors
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

// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 18,
  },
  st0path: {
    fill: '#FFFFFF',
  },
  st1path: {
    fill: '#FFFFFF',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
  },
});
export const AwsAppsLogoIcon = () => {
  const classes = useStyles();

  return (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="16px"
      height="16px"
      viewBox="0 0 16 16"
      enableBackground="new 0 0 16 16"
      xmlSpace="preserve"
      className={classes.svg}
    >
      {' '}
      <image
        id="image0"
        width="16"
        height="16"
        x="0"
        y="0"
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAIGNIUk0AAHomAACAhAAA+gAAAIDo
AAB1MAAA6mAAADqYAAAXcJy6UTwAAADAUExURQAAAAAxgAAzegAxggAwgQAxgQAxgwAyggAygQAy
ggAxgQAxgQAwgAAygQAxggAwgwAwgQAxgQAwggAxgAAxgQAygwAxggAwgQAygQAxgQAwgQAxgQAy
gQAygQAxgQAxgQAwggAxgQAxgQAxggAygQAxgAAxgQAwgAAxgQAxgAAwgQAyggA1gAAwgQAwgAAx
gQAxgQBAgAAwggAygwAxggA3kQA3kgA0igAzhgAyhAA7mwAzhQA2jwA4lAA0if////ZXM5wAAAA1
dFJOUwCHGWhFc21cgDPckkBNOSXDiGA09md4npr4efdxkIzzeqbqcnsa55nakVU9Iq4ghlkEaky3
Ws+rqwAAAAFiS0dEPz5jMHUAAAAHdElNRQfpBBEPCyAzfMjuAAAAfElEQVQY062PVxKCUBAEG3NC
RVExgYg554R6/2M578cTsB+9U101W7WQwFgpIZ2BbE4hX+Ba1C6VoXKzqd5tHjWJuiM0nk23BW67
43ndnmk7L0vsD4a+H4yMCMeRGP8rk3g6m8PbHF0sYfVZs/lGbHcS+wPH8KRwviTxyg8i6QjDfn+r
VwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNS0wNC0xN1QxNToxMTozMiswMDowMGNeX7cAAAAldEVY
dGRhdGU6bW9kaWZ5ADIwMjUtMDQtMTdUMTU6MTE6MzIrMDA6MDASA+cLAAAAKHRFWHRkYXRlOnRp
bWVzdGFtcAAyMDI1LTA0LTE3VDE1OjExOjMyKzAwOjAwRRbG1AAAAABJRU5ErkJggg=="
      />
    </svg>
  );
};
