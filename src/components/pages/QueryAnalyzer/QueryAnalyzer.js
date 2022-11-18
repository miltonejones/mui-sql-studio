import React from 'react';
import { Link, Stack, Box, IconButton , Collapse, Typography, Divider } from '@mui/material';
import { DATA_TYPES, ListGrid, QuickSelect, TextBox, TextBtn, Tooltag, QueryTest,RotateButton } from '../../';
import {  useParams } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { useSaveQuery } from '../../../hooks/useSaveQuery';
import { execQuery, execCommand, describeConnection, describeTable } from '../../../connector/dbConnector';
import { Sync, PlayArrow, Close, ExpandMore, Launch } from '@mui/icons-material'; 
 

function QueryAnalyzer () {
  const { listname, tablename, schema, connectionID } = useParams(); 

  const [loaded, setLoaded] = React.useState(false) ;
  const [configName, setConfigName] = React.useState(null)
  const [connect, setConnect] = React.useState(null)
  const [sqlText, setSqlText] = React.useState(null)
  const [sqlType, setSqlType] = React.useState('SELECT')
  const [tableName, setTableName] = React.useState(null)
  const [showQuery, setShowQuery] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(null);
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const { setAppHistory, Alert, setPageSize, pageSize, setBreadcrumbs  } = React.useContext(AppStateContext);
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
      text: 'Home',
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
    popover: !0 ? null : <Stack sx={{p: 2}} spacing={1}>
      {DATA_TYPES.map(d => <Box onClick={() => runQuery(page)} sx={{cursor: 'pointer'}}><Link>{d}</Link></Box>)}
    </Stack>
  }));

  const chagePageSize = size => {
    setPageSize(size);
    runQuery(1, size);
  }

  const runQuery = async (pg, size) => {
    const command = sqlType === 'SELECT'
      ? execQuery
      : execCommand
    setBusy(true);  
    setData(null);  
    const f = await command(configs[configName], sqlText, pg, size || pageSize); 
    setBusy(false);  
    if (f.error) {
      return Alert(f.error.sqlMessage)
    }
    setPage(pg);
    setData(f); 
  }

  const setTable = async (name, type) => {
    const { rows } = await describeTable(configs[configName], name);
    const cols = rows.map(r => r.COLUMN_NAME).join(', ');
    const deleteSQL = `DELETE FROM ${name} \nWHERE`;
    const updateSQL = `UPDATE ${name} SET\n` + rows.map(r => ` ${r.COLUMN_NAME} = ''`).join('\n,') + '\nWHERE';
    const selectSQL = `SELECT ${cols} \nFROM ${name}`

    switch(type || sqlType) {
      case 'SELECT':
        setSqlText(selectSQL);
        break;
      case 'UPDATE':
        setSqlText(updateSQL);
        break;
      case 'DELETE':
        setSqlText(deleteSQL);
        break;
      default:
        // do nothing
    } 
    setTableName(name)
  }

  const updateSQLType = type => {
    setSqlType(type);
    setTable(tableName, type)
  }

  const Icon = busy ? Sync : PlayArrow;

  return <>
  <Stack>
    
    <Stack direction="row" sx={{alignItems: 'center', mb: 1}}>
      <Box>
        <QuickSelect options={Object.keys(configs)} 
          onChange={setConfig} label="connections" value={configName}/> 
      </Box>

      {!!connect &&  <>
        <QuickSelect options={['SELECT', 'UPDATE', 'DELETE']} disableClearable={false}
        onChange={updateSQLType} label="query type" value={sqlType}/>
        <QuickSelect options={connect} 
        onChange={setTable} label="tables" value={tableName}/>
      </> }
 
      <TextBtn disabled={busy || !sqlText} onClick={() => runQuery(1)} variant="contained"
        color="warning" endIcon={<Icon className={busy ? 'spin' : ''} />}>
        Run
      </TextBtn>

      <Box sx={{flexGrow: 1}} />
       
      <Tooltag title="Test Query" component={QueryTest} onResult={async(msg) => {
        await Alert(`Query completed ${msg.error?'with errors':'successfully'} in ${msg.since}ms.`);
        !!msg.error && Alert(`${msg.error.sqlMessage}`)
      }} noneQuery={sqlType !== 'SELECT'} sql={sqlText} config={configs[configName]} />

      {!!tableName && <IconButton href={`/query/${connectionID}/${schema}/${tableName}`}>
           <Launch />
        </IconButton>}

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
        pageSize={pageSize}
        setPageSize={chagePageSize}
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
