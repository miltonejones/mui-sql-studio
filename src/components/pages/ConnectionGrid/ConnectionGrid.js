import React from 'react'; 
import { ListGrid } from '../../';
import {  Box, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { describeConnection, execCommand } from '../../../connector/dbConnector';
import { Launch, Add, Close } from '@mui/icons-material';
import { useNavigation } from '../../../hooks/AppStateContext';
 
function ConnectionGrid () {
  const [loaded, setLoaded] = React.useState(false) ;
  const [data, setData] = React.useState(null)
  const { connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)
 
  const { navigate } = useNavigation();



  const { setAppHistory, setBreadcrumbs, Prompt, Alert } = React.useContext(AppStateContext);
  
  
  const loadConnection = React.useCallback(async() => {
    setData(null)
    const f = await describeConnection(configs[configKey])
    setData(f);
  }, [configs, configKey]);

  React.useEffect(() => {
    if (!!data) return;
    loadConnection()
  }, [configs, configKey, data, loadConnection])

  const locate = (row, key) => row.find(f => f.field === key).value;

  const dropTable = async (data) => {
    const name = locate(data, 'Table');
 
    const sql = `DROP TABLE ${name}`;
    const ok = await Prompt(<>
        <Typography variant="caption">{sql}</Typography>
        <Box>
        Delete table "{name}"? This action cannot be undone! To confirm this action type <i>delete</i> in the box below.
        </Box>
      </>, 'Confirm table delete', null, null, 'Type "delete"');
    if (ok === 'delete') {
      const res = await execCommand(configs[configKey], sql);
      if (res.error) {
        return Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
      }
      return await loadConnection();
    }
    Alert ('operation cancelled')
  }

  const addTable = async () => {
    const name = await Prompt("What is the name of the new table?");
    if (!name) return;
    const sql = `CREATE TABLE ${name} (
      ID INT PRIMARY KEY 
      );`
 
    
    const res = await execCommand(configs[configKey], sql);
    if (res.error) {
      await Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
    }
    loadConnection();
    // navigate(`/query/${connectionID}/${configs[configKey].database}/${name}`)
  }

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
 
  const breadcrumbs = React.useMemo(() => [
    {
      text: 'Home',
      href: '/'
    },
    {
      text: configKey
    }
  ], [configKey])


  const saveMenu =  [ 
    {
      title: "Add Table",
      icon: Add,
      action: addTable// () => Alert('Add table not implemented')
    },
    {
      title: 'Return to Home',
      icon: Close,
      action:  () => {
        navigate(`/`)
      }
    }, ] 
    React.useEffect(() => {
     
      if(loaded) return
      setAppHistory({
        title: `Connections | ${configKey}`,
        path: `/connection/${connectionID}`,
        connectionID, 
      });
  
      setBreadcrumbs(breadcrumbs);
      setLoaded(true)
  
    }, [configKey, connectionID, breadcrumbs, loaded, setAppHistory, setBreadcrumbs])
    
  return <ListGrid allowDelete onDelete={dropTable} breadcrumbs={breadcrumbs} title={`Tables in "${configKey}"`} menuItems={saveMenu} rows={data?.rows?.map(configRow)} /> 

} 

ConnectionGrid.defaultProps = {};
export default ConnectionGrid;
