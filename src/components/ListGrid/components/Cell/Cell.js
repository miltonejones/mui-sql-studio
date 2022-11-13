 
import { styled } from '@mui/material';
 
const Cell = styled('td')(({theme, selected, control, header, odd, dense, active}) => ({ 
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  padding: control ? 0 : theme.spacing(dense ? 0.5 : 1, 2),
  backgroundColor: header ? 'rgb(240, 240, 240)' : `rgb(${selected ? 230 : 255}, 255, 255)`, 
  color: !active ? 'black' : 'blue',
  cursor: !active ? 'default' : 'pointer',
  whiteSpace: 'nowrap', 
  '&:hover': {
    textDecoration: !active ? 'none' : 'underline',
  }
}));


Cell.defaultProps = {};
export default Cell;
