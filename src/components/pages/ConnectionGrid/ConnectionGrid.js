import React from 'react'; 
import { ListGrid } from '../../';
import { useNavigate, useParams } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { describeConnection } from '../../../connector/dbConnector';
import { Launch, Add, Close } from '@mui/icons-material';
 
function ConnectionGrid () {
  const [loaded, setLoaded] = React.useState(false) ;
  const [data, setData] = React.useState(null)
  const { connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)
  const navigate = useNavigate();


  const { setAppHistory, Alert } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
   
    if(loaded) return
    setAppHistory({
      title: `Connections | ${configKey}`,
      path: `/connection/${connectionID}`,
      connectionID, 
    });
    setLoaded(true)

  }, [configKey, connectionID, loaded, setAppHistory])
  

  React.useEffect(() => {
    if (!!data) return;
    (async() => {
      const f = await describeConnection(configs[configKey])
      setData(f);
    })()
  }, [configs, configKey, data])


  const configRow = (conf) => [
    {
      field: '',
      icon: <Launch />,
      value: 'Open',
      action: () => navigate(`/query/${connectionID}/${configs[configKey].database}/${conf.TABLE_NAME}`)
    },
    {
      field: 'Table',
      value: conf.TABLE_NAME,
      action: () => navigate(`/table/${connectionID}/${configs[configKey].database}/${conf.TABLE_NAME}`)
    },
    {
      field: 'Type',
      value: conf.TABLE_TYPE
    },
    {
      field: 'Rows',
      value: conf.TABLE_ROWS
    },
    {
      field: 'AUTO_INCREMENT',
      value: conf.AUTO_INCREMENT, 
    },
    {
      field: 'CREATE_TIME',
      value: conf.CREATE_TIME
    },
    {
      field: 'UPDATE_TIME',
      value: conf.UPDATE_TIME
    },
  ]
 
  const breadcrumbs = [
    {
      text: 'Home',
      href: '/'
    },
    {
      text: configKey
    }
  ]


  const saveMenu =  [ 
    {
      title: "Add Table",
      icon: Add,
      action: () => Alert('Add table not implemented')
    },
    {
      title: 'Return to Home',
      icon: Close,
      action:  () => {
        navigate(`/`)
      }
    }, ] 
      
  return <ListGrid breadcrumbs={breadcrumbs} title={`Tables in "${configKey}"`} menuItems={saveMenu} rows={data?.rows?.map(configRow)} /> 

} 

ConnectionGrid.defaultProps = {};
export default ConnectionGrid;
