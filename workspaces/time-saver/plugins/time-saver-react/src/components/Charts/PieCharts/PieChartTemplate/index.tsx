import PieChartTemplateView from './view';

/**
 * Props for {@link PieChartTemplate}.
 *
 * @public
 */
export interface PieChartTemplateProps {
  options: any;
  data: any;
}

/**
 * Displays a pie chart template component.
 *
 * @public
 */
const PieChartTemplate = (props: PieChartTemplateProps) => {
  return <PieChartTemplateView {...props} />;
};
export default PieChartTemplate;
