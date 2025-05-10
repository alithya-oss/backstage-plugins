import Avatar from '@material-ui/core/Avatar';
import { Theme } from '@material-ui/core';

export interface GaugeTemplateViewProps {
  avatarColor?: string;
  heading?: string;
  theme: Theme;
  data?: number;
}

const GaugeTemplateView = (props: GaugeTemplateViewProps) => (
  <>
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Avatar
        style={{
          width: 120,
          height: 120,
          fontSize: 36,
          backgroundColor: props.avatarColor,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          color: '#fff',
          marginBottom: '8px',
          border: '3px solid #005052',
        }}
      >
        {props.data}
      </Avatar>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: props.theme?.palette.text.primary,
        }}
      >
        {props?.heading}
      </div>
    </div>
  </>
);
export default GaugeTemplateView;
