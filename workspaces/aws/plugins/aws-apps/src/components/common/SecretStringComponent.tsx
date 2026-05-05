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

import { IconButton } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { useState } from 'react';

/**
 * A UI component for displaying sensitive strings
 *
 * @param secret The sensitive string to display/hide
 * @returns a JSXElement used for easily displaying/hiding a string via a toggle icon
 */
export const SecretStringComponent = ({ secret }: { secret: string }) => {
  const [hidden, setHidden] = useState(true);

  const toggleVisibility = () => setHidden(!hidden);

  return (
    <>
      {/* <Typography noWrap> */}
      {hidden ? secret.replaceAll(/./g, '●') : secret}
      <IconButton onClick={toggleVisibility}>
        {hidden ? <VisibilityOff /> : <Visibility />}
      </IconButton>
      {/* </Typography> */}
    </>
  );
};
