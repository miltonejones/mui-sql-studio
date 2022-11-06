import * as React from 'react';
import {  Box, Chip, styled} from '@mui/material';
import MenuDrawer, { Logo } from '../MenuDrawer/MenuDrawer';
import ConnectionModal from '../ConnectionModal/ConnectionModal';
import { useConfig } from '../../hooks/useConfig';
import {  
  useNavigate 
} from "react-router-dom";

import { Star, StarBorder } from '@mui/icons-material';


const Navbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: 'white',
   position: 'absolute',
   top: 0,
   left:  0,
   width: '100vw',
   backgroundColor: theme.palette.primary.main,
   minHeight: 40
}));


const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
export default function ToggleToolbar({ onPin, getAppHistory, current, getFavorite, getFavorites, setFavorite }) {
  const navigate = useNavigate();
  const { getConfigs, saveConfig  } = useConfig()
  const configs = getConfigs();

  const past = getAppHistory();
  const guys = getFavorites();

  const [modalState, setModalState] = React.useState({
    open: false,
    connection: {  }, 
  });

  const buttons = [
    { 
      label: 'All',
      options: [
        {
          title: 'Connections',
          descendants:  Object.keys(configs).map(title => ({
            title,
            active: current?.title?.indexOf(title) > -1,
            action: () => navigate(`/connection/${formatConnectName(title)}`)
          }))
        }, 
        {
          title: 'New Connection...',
          action: () => {
            setModalState({
              open: true,
              connection: { title: 'New Connection', host: '', user: '', password: ''},
              onClose: async (c) => { 
                !!c && saveConfig(c)
                setModalState({ open: false })
              }
            })
          }
        }
      ]
    },
    { 
      label: 'Favorites',
      options: guys.length ? guys.map(p => ({
        title: p.title,
        active: p.path === current?.path,
        action: () => navigate(p.path)
      })) : [
        {
          title: 'No favorites yet', 
        }, 
      ]
    },
    { 
      label: 'History',
      options: past.length ? past.map(p => ({
        title: p.title,
        active: p.path === current?.path,
        action: () => navigate(p.path)
      })) : [
        {
          title: 'No history yet', 
        }, 
      ]
    }
  ] 

  const Icon = current?.favorite ? Star : StarBorder;


  return <><Navbar >
    <Logo />
    {buttons.map((btn => <MenuDrawer report={onPin} key={btn.label} {...btn} />))}
    <Box sx={{flexGrow: 1}} /> 
    <Box sx={{mr: 2}}>
      {!!current?.title && <Chip label={current.title} color="success" size="small" variant="filled"
        sx={{minWidth: 120, border: 'solid 1px white'}}
              onDelete={() => {
                setFavorite (current.path);
                window.location.reload()
              }}
              deleteIcon={<Icon />}/>} 
    </Box>
  </Navbar>
  
  <ConnectionModal onChange={(key, val) => {
    setModalState({ ...modalState, connection: {
      ...modalState.connection,
      [key]: val
    }})
  }} {...modalState} />
  
  </>

}