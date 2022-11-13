
import { styled, Box } from '@mui/material';
  
 
const Panel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  overflowX: 'auto',
  position: 'absolute', 
  top: 0, 
  left: 0,
  height: '100vh',
  minWidth: 300, 
}));

Panel.defaultProps = {};
export default Panel;
