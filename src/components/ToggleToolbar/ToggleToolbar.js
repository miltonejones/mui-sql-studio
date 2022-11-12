import * as React from 'react';
import {  Box, Chip, Stack, styled} from '@mui/material';
import MenuDrawer from '../MenuDrawer/MenuDrawer'; 
import Logo from '../MenuDrawer/components/Logo/Logo'; 
import { useConfig } from '../../hooks/useConfig';
import { useSaveQuery } from '../../hooks/useSaveQuery';
import { Star, StarBorder } from '@mui/icons-material';
import moment from 'moment';



const Navbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  // alignContent: 'center',
  justifyContent: 'space-between',
  color: 'white',
   position: 'absolute',
   top: 0,
   left:  0,
   width: '100vw',
   backgroundColor: theme.palette.primary.main,
   minHeight: 40
}));


const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
export default function ToggleToolbar({  
    pinnedTab, 
    setPinnedTab, 
    getAppHistory, 
    current, 
    getFavorite, 
    getFavorites, 
    setFavorite ,
    setModalState
  }) {
  const navigate = (href) => window.location.replace(href); // useNavigate();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const { getQueries } = useSaveQuery();

  const gesh = getAppHistory();
  const past = gesh.length < 10 ? gesh 
    : gesh.slice( gesh.length - 10)
  const guys = getFavorites();
  const asks = getQueries();

  console.log ({ asks })

  const queryNode = Object.keys(asks).length ? [{
    title: 'Lists',
    descendants:  Object.keys(asks).map(title => {
      const { schema, tablename, connectionID } = asks[title];
      return {
        title,
        active: current?.title?.indexOf(title) > -1,
        action: () => navigate(`/lists/${connectionID}/${schema}/${tablename}/${formatConnectName(title)}`)
      }
    })
  }] : []

  const humanize = time => { 
    var duration = moment.duration(new Date().getTime() - new Date(time).getTime());
    return duration.humanize() + ' ago'
  }

  const buttons = [
    { 
      label: 'All',
      options: queryNode.concat([

        {
          title: 'Connections',
          descendants: Object.keys(configs).map(title => ({
            title,
            active: current?.title?.indexOf(title) > -1,
            action: () => navigate(`/connection/${formatConnectName(title)}`)
          }))
        }, 


        // {
        //   title: 'New Connection...',
        //   action: () => {
        //     setModalState({
        //       open: true,
        //       connection: { title: 'New Connection', host: '', user: '', password: ''},
        //       onClose: async (c) => { 
        //         !!c && saveConfig(c)
        //         setModalState({ open: false })
        //       }
        //     })
        //   }
        // },
        

        {
          title: 'Query Analyzer',
          action: () => navigate(`/sql`)
        }
        
      ])
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
      options: past.filter(f => !!f.when).length ? past.filter(f => !!f.when).map(p => ({
        title: p.title,
        active: p.path === current?.path,
        subtext: humanize(p.when),
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

  <Stack direction="row">

  <Logo short={!pinnedTab} />
    {buttons.map((btn => <MenuDrawer setPinnedTab={setPinnedTab} pinnedTab={pinnedTab} key={btn.label} {...btn} />))}

  </Stack>

    <Box>
      {!!current?.title && <Chip label={current.title} color="secondary" variant="filled"
        sx={{minWidth: 120, backgroundColor: 'rgba(0,0,0,0.5)', border: 'solid 1px rgba(255, 255, 255, 0.4)'}}
              onDelete={() => {
                setFavorite (current.path);
                window.location.reload()
              }}
              deleteIcon={<Icon />}/>} 
    </Box>
    
    <Box sx={{flexShrink: 1, width: pinnedTab ? 300 : 450}}/>

  </Navbar>
  
  {/* <ConnectionModal onChange={(key, val) => {
    setModalState({ ...modalState, connection: {
      ...modalState.connection,
      [key]: val
    }})
  }} {...modalState} /> */}
  
  </>

}