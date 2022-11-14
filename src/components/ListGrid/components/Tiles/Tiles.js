
import { styled } from '@mui/material';
 

const Tiles = styled('table')(({ theme, wide }) => ({ 
  backgroundColor: '#d9d9d9',
   minWidth: wide ? '80vw' : 0,
  // borderRadius: 5
}));
   

Tiles.defaultProps = {};
export default Tiles;
