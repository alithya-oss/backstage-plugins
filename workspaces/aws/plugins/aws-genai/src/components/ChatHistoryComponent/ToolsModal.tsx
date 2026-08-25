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

import {
  Accordion,
  AccordionGroup,
  AccordionPanel,
  AccordionTrigger,
  Dialog,
  DialogBody,
  DialogHeader,
  Text,
} from '@backstage/ui';
import { ToolRecord } from '../types';
import { MarkdownContent } from '../MarkdownContent';

interface ToolParametersProps {
  tool: ToolRecord;
}

const ToolsParameters = ({ tool }: ToolParametersProps) => {
  let data: unknown;

  try {
    data = JSON.parse(tool.input);
  } catch {
    data = tool.input;
  }

  const markdown = `
~~~json\n${JSON.stringify(data, undefined, 2)}\n~~~
`;

  return <MarkdownContent content={markdown} />;
};

interface ToolsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tools: ToolRecord[];
}

export const ToolsModal = ({ open, onOpenChange, tools }: ToolsModalProps) => (
  <Dialog isOpen={open} onOpenChange={onOpenChange} width={800}>
    <DialogHeader>Tools</DialogHeader>
    <DialogBody>
      {tools.length === 0 ? (
        <Text color="secondary">No tools were called for this message.</Text>
      ) : (
        <AccordionGroup allowsMultiple>
          {tools.map((tool, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Accordion key={`${tool.name}-${index}`}>
              <AccordionTrigger title={tool.name} />
              <AccordionPanel>
                <ToolsParameters tool={tool} />
              </AccordionPanel>
            </Accordion>
          ))}
        </AccordionGroup>
      )}
    </DialogBody>
  </Dialog>
);
