import React from 'react';
import BarChartTemplateView from './view';

/**
 * Props for {@link BarChartTemplate}.
 *
 * @public
 */
export interface BarChartTemplateProps {
  options: any;
  data: any;
}

/**
 * Provides a time saved statistics' bar chart template.
 *
 * @public
 */
const BarChartTemplate = (props: BarChartTemplateProps) => {
  return (
    <>
      <BarChartTemplateView {...props} />
    </>
  );
};
export default BarChartTemplate;
