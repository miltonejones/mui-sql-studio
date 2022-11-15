import React from 'react';
import {  Stack, Box, IconButton , Collapse, Typography, Divider } from '@mui/material';
import { ListGrid, QuickSelect, TextBox, TextBtn, Tooltag, QueryTest,RotateButton } from '../../';
import {  useParams } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { useSaveQuery } from '../../../hooks/useSaveQuery';
import { execQuery, describeConnection, describeTable } from '../../../connector/dbConnector';
import { Sync, PlayArrow, Close, ExpandMore } from '@mui/icons-material'; 
 

function QueryAnalyzer () {
  const { listname, connectionID } = useParams(); 

  const [loaded, setLoaded] = React.useState(false) ;
  const [configName, setConfigName] = React.useState(null)
  const [connect, setConnect] = React.useState(null)
  const [sqlText, setSqlText] = React.useState(null)
  const [tableName, setTableName] = React.useState(null)
  const [showQuery, setShowQuery] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(null);
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const { setAppHistory, Alert, setBreadcrumbs  } = React.useContext(AppStateContext);
  const { getQueries } = useSaveQuery();


  const setConfig = React.useCallback(async (name) => {
    const f = await describeConnection(configs[name]);
    setConnect(f?.rows.map(r => r.TABLE_NAME));
    setConfigName(name);
  }, [configs])

  React.useEffect(() => {
   
    if (loaded) return;

    setBreadcrumbs([{
      href: '/',
      text: 'Home'
    }, 
      {
        text: 'Query Analyzer'
      }])

    if (listname) {
      const lists = getQueries();
      const title = Object.keys(lists).find(f => formatConnectName(f) === listname);
      const conf = Object.keys(configs).find(f => formatConnectName(f) === connectionID);
      setSqlText(lists[title].queryText)
      setConfig (conf)
      setTableName(lists[title].tablename) 
    }
  
    
    setAppHistory({
      title: `Home | Query Analyzer`,
      path: `/sql` 
    });
  
    setLoaded(true)

  }, [ setAppHistory, loaded, configs, connectionID, getQueries, listname, setConfig ])
  
 
  const configRow = (conf) => Object.keys(conf).map(key => ({
    field: key,
    value: conf[key], 
  }));

  const runQuery = async (pg) => {
    setBusy(true);  
    setData(null);  
    const f = await execQuery(configs[configName], sqlText, pg); 
    setBusy(false);  
    setPage(pg);
    setData(f); 
  }

  const setTable = async (name) => {
    const { rows } = await describeTable(configs[configName], name);
    const cols = rows.map(r => r.COLUMN_NAME).join(', ') 
    setSqlText(`SELECT ${cols} 
FROM ${name}`)
    setTableName(name)
  }

  const Icon = busy ? Sync : PlayArrow;

  return <>
  <Stack>
    
    <Stack direction="row" sx={{alignItems: 'center', mb: 1}}>
      <Box>
        <QuickSelect options={Object.keys(configs)} 
          onChange={setConfig} label="connections" value={configName}/> 
      </Box>

      {!!connect &&  <QuickSelect options={connect} 
        onChange={setTable} label="tables" value={tableName}/> }

      <TextBtn disabled={busy || !sqlText} onClick={() => runQuery(1)} variant="contained"
        color="warning" endIcon={<Icon className={busy ? 'spin' : ''} />}>
        Run
      </TextBtn>

      <Box sx={{flexGrow: 1}} />
       
      <Tooltag title="Test Query" component={QueryTest} onResult={async(msg) => {
        await Alert(`Query completed ${msg.error?'with errors':'successfully'} in ${msg.since}ms.`);
        !!msg.error && Alert(`${msg.error.sqlMessage}`)
      }}   sql={sqlText} config={configs[configName]} />

      {!!data && <IconButton onClick={() => setData(null)}>
        <Close />
      </IconButton>}

      <RotateButton deg={showQuery ? 0 : 180} onClick={() => setShowQuery(!showQuery)}>
        <ExpandMore />
      </RotateButton>
    </Stack>

    {configs[configName] && <Collapse in={showQuery}>
      <TextBox value={sqlText} fullWidth 
        onChange={e => setSqlText(e.target.value)} 
        
        placeholder="Type or paste SQL code"
        multiline rows={!!data?.rows ? 8 : 0} />
      </Collapse>}

    {!!data?.error && <> 
      <Typography>{data.error.code}</Typography>
      <Alert severity="error">{JSON.stringify(data.error.sqlMessage)}</Alert>
    </>}

    {!!data?.rows && 
    <>
      <Divider sx={{mb: 1}} >
        Query results
      </Divider>
      <ListGrid   
        count={data?.count}
        setPage={runQuery} 
        page={page}  
        rows={data?.rows?.map(configRow)}  
      />
    </>  }
  </Stack>
  </>
} 
  

QueryAnalyzer.defaultProps = {};
export default QueryAnalyzer;
