import React from 'react'; 
import { TextBtn, ListGrid } from '../../';
import { Alert } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { Settings, Launch, Add } from '@mui/icons-material';
 


function HomePage ({ pinned }) {
  
  const [loaded, setLoaded] = React.useState(false) ;
  const { getConfigs, saveConfig  } = useConfig();
  const configs = getConfigs();
  const navigate = useNavigate();

 
  const { setAppHistory, setModalState, setBreadcrumbs } = React.useContext(AppStateContext);
 
  
 
  const configRow = (conf) => [
    {
      icon: <Launch />,
      field: 'title',
      value: conf.title,
      action: () => navigate(`/connection/${formatConnectName(conf.title)}`)
    },
    {
      field: 'host',
      value: conf.host, 
      icon: <Settings />,
      action: () => openConnectionModal(conf)
    },
    {
      field: 'user',
      value: conf.user
    },
    {
      field: 'password',
      value: conf.password,
      type: 'password'
    },
    {
      field: 'database',
      value: conf.database,
      type: 'password'
    },
  ]  
 
  const breadcrumbs = [
    {
      text: 'Home' 
    }, 
  ];


  const openConnectionModal = (conf) => {
    setModalState({
      open: true,
      connection: conf || { title: 'New Connection', host: '', user: '', password: ''},
      onClose: async (c) => { 
        !!c && saveConfig(c)
        setModalState({ open: false })
      }
    })
  };

  
  const rows = Object.keys(configs).map(f => configRow({...configs[f], title: f}));
 

  const saveMenu =  [ 
    {
      title: "New Connection...",
      icon: Add,
      action: openConnectionModal
    },  ] 
      
  React.useEffect(() => {
    if (loaded) return;
    setAppHistory({
      title: `Home`,
      path: `/` 
    });
    setBreadcrumbs(breadcrumbs);
    setLoaded(true)
  }, [ setAppHistory, loaded, breadcrumbs ])
  
  if (!rows.length) {
    return <Alert severity="warning">
      You do not have any connections created.  
        <TextBtn 
          size="small" 
          endIcon={<Add />} 
          variant="contained" 
          onClick={openConnectionModal}>Click here</TextBtn> to create one.
    </Alert>
  }

  return <ListGrid wide breadcrumbs={breadcrumbs} title="Available Connections" menuItems={saveMenu} rows={rows} />
}


HomePage.defaultProps = {};
export default HomePage;
