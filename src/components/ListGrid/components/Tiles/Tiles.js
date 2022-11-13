import React from 'react';
import { styled } from '@mui/material';
 

const Tiles = styled('table')(({theme}) => ({ 
  backgroundColor: '#d9d9d9',
  // minWidth: '80vw',
  // borderRadius: 5
}));
   

Tiles.defaultProps = {};
export default Tiles;
