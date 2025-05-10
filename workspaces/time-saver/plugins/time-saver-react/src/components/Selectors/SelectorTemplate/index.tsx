import SelectorTemplateView from './view';

/**
 * Props for {@link SelectorTemplate}.
 *
 * @public
 */
export interface SelectorTemplateProps {
  defaultValue: string;
  label: string;
  items: string[];
  handleChange?: (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode,
  ) => void;
  handleClearClick?: React.MouseEventHandler<HTMLButtonElement>;
  onClearButtonClick?: boolean;
}

/**
 * Displays a selector template component.
 *
 * @public
 */
export function SelectorTemplate(props: SelectorTemplateProps) {
  return <SelectorTemplateView {...props} />;
}
