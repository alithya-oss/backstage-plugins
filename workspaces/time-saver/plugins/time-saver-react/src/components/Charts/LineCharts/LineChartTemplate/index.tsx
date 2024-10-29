import React from 'react';
import LineChartTemplateView from './view';

/**
 * Props for {@link LineChartTemplate}.
 *
 * @public
 */
export interface LineChartTemplateProps {
  options: any;
  data: any;
}

/**
 * Displays a line chart template component.
 *
 * @public
 */
const LineChartTemplate = (props: LineChartTemplateProps) => {
  return <LineChartTemplateView {...props} />;
};
export default LineChartTemplate;
