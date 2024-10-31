import React from 'react';
import GaugeTemplateView from './view';
import { useTheme } from '@material-ui/core';

/**
 * Props for {@link GaugeTemplate}.
 *
 * @public
 */
export interface GaugeTemplateProps {
  avatarColor?: string;
  heading?: string;
  data?: number;
}

/**
 * Displays a gauge template component.
 *
 * @public
 */
export function GaugeTemplate(props: GaugeTemplateProps) {
  const theme = useTheme();
  return <GaugeTemplateView {...props} theme={theme} />;
}
