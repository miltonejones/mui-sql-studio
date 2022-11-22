import * as React from 'react';
import {  Box, Chip, Stack, styled} from '@mui/material'; 
import MenuDrawer from '../MenuDrawer/MenuDrawer'; 
import Logo from '../MenuDrawer/components/Logo/Logo';  
import { useAppMenu } from '../../hooks/useAppMenu';
import { Star, StarBorder } from '@mui/icons-material';
import { QuickNav } from '..';
 



const Navbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center', 
  justifyContent: 'space-between',
  color: 'white',
   position: 'absolute',
   top: 0,
   left:  0,
   width: '100vw',
   backgroundColor: theme.palette.primary.dark,
   minHeight: 48
}));

 
  
export default function ToggleToolbar({  
    pinnedTab, 
    setPinnedTab,  
    current,   
    setFavorite  ,
    getFavorite
  }) {  
 
  

  const { buttons } = useAppMenu()

  const Icon = getFavorite(current?.path) ? Star : StarBorder;


  return <>
  <Navbar >

    <Stack direction="row">

      <Logo short={!pinnedTab} />
      
      {/* menu buttons  */}
      {buttons.map((btn => <MenuDrawer 
          setPinnedTab={setPinnedTab} 
          pinnedTab={pinnedTab} 
          key={btn.label} 
          {...btn} />))}

    </Stack>

    {/* navigation chip  */}
    <Box>
      {!!current?.title && <Chip label={current.title} color="secondary" variant="filled"
        sx={{minWidth: 120, backgroundColor: 'rgba(0,0,0,0.5)', border: 'solid 1px rgba(255, 255, 255, 0.4)'}}
              onDelete={() => {
                setFavorite (current.path);
             //   window.location.reload()
              }}
              deleteIcon={<Icon />}/>} 
    </Box>
    
    <Box sx={{flexShrink: 1, width: pinnedTab ? 300 : 450, textAlign: 'right', pr: 2}}>
      <QuickNav />
    </Box>

  </Navbar>
   
  </>

}