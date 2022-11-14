
import * as React from 'react';
import { 
  BrowserRouter,  
  Routes, 
  Route,
  useNavigate,
  useParams
} from "react-router-dom";
import './App.css';
import './components/ListGrid/ListGrid.css';
import Modal, { useModal } from './components/Modal/Modal';
import { 
  ToggleToolbar, 
  Area, 
  ListGrid, 
  QueryTest, 
  RotateButton, 
  ConnectionModal, 
  Tooltag, 
  QuickSelect, 
  QuerySettingsPanel 
} from './components'
import { Alert, TextField, Box, Button, Collapse, Divider, IconButton, Stack, Typography, styled } from '@mui/material';
import { useConfig } from './hooks/useConfig';
import { useSaveQuery } from './hooks/useSaveQuery';
import { useAppHistory } from './hooks/useAppHistory';
import { AppStateContext } from './hooks/AppStateContext';
import { useQueryTransform } from './hooks/useQueryTransform';
import { execQuery, describeConnection, describeTable } from './connector/dbConnector';
import {Helmet} from "react-helmet";
import { JsonTabs } from './components/pages';

import { Add, ExpandMore, PlayArrow, Info, Sync, Settings, Launch, Key, Close, FilterAlt, SaveAs, Save, Delete } from '@mui/icons-material';
 

const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
const EMPTY_CONFIGURATION = {
  tables: [],
  wheres: [],
  orders: [],
  groups: [],
  fields: []
};

const TextBox = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(1), 
  marginBottom: theme.spacing(1),
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
    lineHeight: 1.5,
    fontFamily: 'Courier'
  }
}))

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
  const { setAppHistory, Alert  } = React.useContext(AppStateContext);
  const { getQueries } = useSaveQuery();


  const setConfig = React.useCallback(async (name) => {
    const f = await describeConnection(configs[name]);
    setConnect(f?.rows.map(r => r.TABLE_NAME));
    setConfigName(name);
  }, [configs])

  React.useEffect(() => {
   
    if (loaded) return;

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

      <Button disabled={busy || !sqlText} onClick={() => runQuery(1)} variant="contained"
        color="warning" endIcon={<Icon className={busy ? 'spin' : ''} />}>
        Run
      </Button>

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

function QueryGrid () {

  const navigate = useNavigate();

  const { schema, tablename, listname, connectionID } = useParams();
  const { createTSQL } = useQueryTransform()


  const [configuration, setConfiguration] = React.useState(EMPTY_CONFIGURATION);
  const [queryText, setQueryText] = React.useState(`SELECT * FROM ${tablename}`);
  const [empty, setEmpty] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [page, setPage] = React.useState(1) ;
  const [edit, setEdit] = React.useState(false) ;
  const [loaded, setLoaded] = React.useState(false) ;
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID);


  const { setAppHistory, Alert, Prompt, Confirm } = React.useContext(AppStateContext);
  const saveEnabled = !!configuration.tables.length

  const { saveQuery, deleteQuery, getQueries } = useSaveQuery();
 
  
  React.useEffect(() => {
   
    if (!!loaded) return;

    let props = {
      title: `${configKey} | ${tablename} | List`,
      path: `/query/${connectionID}/${schema}/${tablename}`,
    }

    if (listname) {
      const lists = getQueries();
      const title = Object.keys(lists).find(f => formatConnectName(f) === listname);
      props = {
        title: `${configKey} | ${tablename} | List | ${title} `,
        path: `/lists/${connectionID}/${schema}/${tablename}/${listname}`,
      }
    }
  
    setAppHistory({
      ...props,
      connectionID,
      schema,
      tablename,
      listname
    });
   

  }, [configKey, loaded, getQueries, connectionID, tablename, schema, listname, setAppHistory])
  

  const deletePage = async (key) => {
    const ok = await Confirm(`Delete saved query "${key}"?`);
    if (!ok) return;
    deleteQuery(key);
    window.location.replace(`/query/${connectionID}/${schema}/${tablename}`)
  }

  const savePage = async () => { 
    const title = await Prompt (
      `Enter a name for your query` ,
      'Save query',
      configuration.title
    );
    if (!title) return;
    const query = {
      title,
      queryText,
      schema, 
      tablename, 
      connectionID,
      ...configuration
    }
    saveQuery(query);
    setConfiguration(query);
  }


  const loadPage = React.useCallback (async (pg, sql) => {  
    setData(null); 
    setEmpty(false);
    const f = await execQuery(configs[configKey], sql || queryText, pg); 
    setPage(pg);
    setData(f); 
    setEmpty(!f?.rows?.length)
  
  }, [configs, configKey, queryText])

  const execQueryText = (text) => { 
    setData(null); 
    setQueryText(text)
    setEdit(false);
    loadPage(1, text);
  }

  React.useEffect(() => {
    if (!!loaded) return;
    let sql = null;
    if (!!listname) {
      const lists = getQueries();
      const title = Object.keys(lists).find(f => formatConnectName(f) === listname);
      const conf = lists[title]; 
 
      setConfiguration({
        title,
        ...conf
      });
 
      setQueryText(conf.queryText); 
      sql = conf.queryText;
    }

    loadPage(1, sql) ;
    setLoaded(true)
  }, [data, loaded, loadPage, getQueries, listname]);

  const configRow = (conf, fields) => Object.keys(conf).map(key => ({
    field: key,
    value: conf[key],
    alias: (() => {
      const field = fields.find(f => f.name === key);
      if (!field) return key;
      const {orgTable, orgName} = field;
      return `${orgTable}.${orgName}`;
    })()
  }));

  const fieldByAlias = (alias) => {
    let name = alias;
    configuration.tables.map(t => {
      const col = t.columns.find(c => c.alias === alias);
      if (col) {
        name = `${t.name}.${col.name}`
      }
      return t;
    });
    return name;
  }

  const adHocProp = prop => {
    switch (true) {
      case prop.indexOf('*') < 0:
        return 'EQUALS'
      case prop.startsWith('*') && prop.endsWith('*'):
        return 'CONTAINS'
      case prop.startsWith('*'):
        return 'ENDS WITH'
      case prop.endsWith('*'):
        return 'STARTS WITH'
      default: 
        return 'CONTAINS'
    } 
  }

  const orderAdHoc = async (fieldName, direction = 'ASC') => {
    const orders =  configuration.orders
    .filter(w => !(w.field === fieldName && w.temp) )
    .concat({
      fieldName: fieldByAlias(fieldName),
      field: fieldName, 
      direction,
      temp: !0
    })
    //  await Confirm (JSON.stringify(orders))
    const paramConf = {
      ...configuration,
      orders
    }
    execAdHoc(paramConf); 
  }
 
  const createAdHoc = (fieldName, clauseProp) => {
    const paramConf = {
      ...configuration,
      wheres: configuration.wheres
      .filter(w => !(w.field === fieldName && w.temp) )
      .concat({
        fieldName: fieldByAlias(fieldName),
        field: fieldName,
        value: clauseProp,
        clauseProp: clauseProp.replace(/\*/g, ''), 
        predicate: adHocProp(clauseProp),
        temp: !0
      })
    }
    execAdHoc(paramConf); 
  }
 
  const dropAdHoc = (fieldName, clauseProp) => {
    if (!fieldName) {
      const paramConf = {
        ...configuration,
        wheres: configuration.wheres
        .filter(w => !w.temp ) 
      }
      return execAdHoc(paramConf); 
    }
    const paramConf = {
      ...configuration,
      wheres: configuration.wheres
      .filter(w => !(w.field === fieldName && w.temp) ) 
    }
    execAdHoc(paramConf); 
  }

  const dropOrder =async  (fieldName) => { 
    const orders =  configuration.orders
    .filter(w => !(w.field === fieldName || w.fieldName.indexOf(fieldName) > -1) ) ;
      // await Confirm (JSON.stringify(orders))
    const paramConf = {
      ...configuration,
      orders 
    }
    execAdHoc(paramConf); 
  }

  const execAdHoc = async (conf) => {
    conf.wheres.map((w, i) => !!w.temp && Object.assign(w, {operator: i === 0 ? null : 'AND'}))
    setConfiguration(conf);
    const sql = createTSQL(conf); 
    setQueryText(sql); 
    loadPage(1, sql) ;
  }

  const temps = configuration.wheres 
  .filter(f => f.temp);
  const queryDesc = temps
    .map(f => `${f.field} ${adHocProp(f.value).toLowerCase()} "${f.clauseProp}"`)
    .join(' AND ');
 
  const breadcrumbs = [
    {
      text: 'Home',
      href: '/'
    },
    {
      text: configKey,
      href: '/connection/' + connectionID
    },
    {
      text: tablename,
      href: `/table/${connectionID}/${schema}/${tablename}`
    },
    {
      text: 'List',
      href: saveEnabled ? `/query/${connectionID}/${schema}/${tablename}` : null
    }
  ]
  .concat(saveEnabled ? [
    {
      text: configuration.title || 'Unnamed Query',
      href: (temps.length && configuration.title) || edit ? `/lists/${connectionID}/${schema}/${tablename}/${listname}` : null
    }
  ] : [])
  .concat(temps.length ? [
    {
      text: queryDesc
    }
  ] : [])
 
const saveMenu = saveEnabled ? [
  {
    title: 'Delete List',
    icon: Delete,
    action: () => deletePage(configuration.title)
  },
  {
    title: "Save List",
    icon: Save,
    action: savePage
  },
  {
    title: 'Open in Query Analyzer',
    icon: Launch,
    action:  () => {
      navigate(`/sql/${connectionID}/${schema}/${tablename}/${listname}`)
    }
  }, ] : []
  
  const menuItems = saveMenu.concat([
    {
      title: 'Show SQL',
      icon: Info,
      action: () => Alert(<pre>{JSON.stringify(queryText)}</pre>, 'SQL Code')
    },
    {
      title: "Set list filters",
      icon: FilterAlt,
      action:  () => {
        setEdit(!edit)
      }
    }, 
    {
      title: 'Close',
      icon: Close,
      action:  () => {
        navigate(`/table/${connectionID}/${schema}/${tablename}`)
      }
    },   
  ]);
 

  return <> 

    {!!data?.error && <> 
      <Typography>{data.error.code}</Typography>
      <Alert severity="error">{JSON.stringify(data.error.sqlMessage)}</Alert>
    </>}

  <Collapse in={!edit}>  
    <ListGrid  
      dense
      wide
      onSearch={createAdHoc}
      onSort={orderAdHoc}
      onClear={dropAdHoc} 
      dropOrder={dropOrder}
      sorts={configuration.orders}
      searches={configuration.wheres}
      columns={configuration.columnMap?.concat(configuration.fields)}
      searchable={saveEnabled}
      setPage={loadPage}
      count={data?.count}
      page={page}
      menuItems={menuItems} 
      title={`${tablename}`} 
      breadcrumbs={breadcrumbs} 
      rows={data?.rows?.map(row => configRow(row, data?.fields))} 
      empty={empty}
    />  
  </Collapse>
  <Collapse in={edit}> 
    {edit && <QuerySettingsPanel 
    breadcrumbs={breadcrumbs.concat({
      text: `Edit ${tablename} SQL`
    })}
      onCommit={execQueryText} 
      onCancel={() => setEdit(false)} 
      config={configs[configKey]} 
      tablename={tablename}
      configuration={configuration} 
      setConfiguration={setConfiguration}
    />}
  </Collapse>
  </>
}
 
function TableGrid () {
  const [loaded, setLoaded] = React.useState(false) ;
  const navigate = useNavigate();
  const [data, setData] = React.useState(null)
  const { schema,  tablename, connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)

  const { Alert, Confirm, setAppHistory } = React.useContext(AppStateContext);
  

  
  const configRow = (conf) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [ 
      {
        field: 'Name', 
        value: conf.COLUMN_NAME,
        icon: !!conf.CONSTRAINT_NAME ? <Key color={ conf.CONSTRAINT_NAME === 'PRIMARY' ? "primary" : "warning"} /> : '',
        edit: !0
      }, 
      {
        field: 'Position',
        value: conf.ORDINAL_POSITION
      },
      {
        field: 'Default',
        value: conf.COLUMN_DEFAULT,
        edit: !0
      },
      {
        field: 'Nullable',
        value: conf.IS_NULLABLE, 
        types: ['YES', 'NO']
      },
      {
        field: 'Type',
        value: !parts ? conf.COLUMN_TYPE : parts[1],
        types: ['int', 'bit', 'bigint', 'text', 'mediumtext', 'varchar', 'datetime']
      }, 
      {
        field: 'Size',
        value: !parts ? '' : parts[2],
        edit: !0
      }, 
    ]
  }

  const commitRow = async ({ data: new_def, row: old_def}) => {  
    const locate = (row, key) => row.find(f => f.field === key).value;
    const command = [`ALTER TABLE ${tablename}`];
    command.push (
      locate(old_def, "Name") === locate(new_def, "Name") 
        ? `MODIFY COLUMN ${locate(old_def, "Name")}`
        : `CHANGE COLUMN ${locate(old_def, "Name")} ${locate(new_def, "Name")}`,
      locate(new_def, "Type")
    );
    !!locate(new_def, "Size") && !!locate(new_def, "Size").trim() && 
      command.push(`(${locate(new_def, "Size")})`);
    command.push(locate(new_def, "Nullable") === 'YES' ? "NULL" : "NOT NULL");
    !!locate(new_def, "Default") && command.push (`DEFAULT "${locate(new_def, "Default")}"`);
    const sql = command.join(' ');
    const ok = await Confirm(sql);
    if (!ok) return;
    await execQuery(configs[configKey], sql);
    await loadTable();
  }
  
  const loadTable = React.useCallback(async() => {
    const f = await execQuery(configs[configKey], `SELECT
    u.CONSTRAINT_NAME, u.REFERENCED_TABLE_NAME, u.REFERENCED_COLUMN_NAME, 
    t.COLUMN_NAME,	t.ORDINAL_POSITION,	t.COLUMN_DEFAULT,	t.IS_NULLABLE,t.COLUMN_TYPE	 ,
    t.DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS t LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE u 
    ON u.TABLE_NAME = t.TABLE_NAME and u.COLUMN_NAME = t.COLUMN_NAME
    WHERE t.TABLE_NAME = '${tablename}' 
    GROUP BY t.ORDINAL_POSITION ORDER BY t.ORDINAL_POSITION `)
    setData(f);
  }, [configs, configKey, tablename]);

  React.useEffect(() => {
    if (!!data) return;
    loadTable();
  }, [ data, loadTable ])
 

  const breadcrumbs = [
    {
      text: 'Home',
      href: '/'
    },
    {
      text: configKey,
      href: '/connection/' + connectionID
    },
    {
      text: tablename
    }
  ] 

  const saveMenu =  [
    {
      title: 'Open Table',
      icon: Launch,
      action:  () => {
        navigate(`/query/${connectionID}/${schema}/${tablename}`)
      }
    },  
    {
      title: "Add Column",
      icon: Add,
      action: () => Alert('Add column not implemented')
    },
    {
      title: 'Return to Connection',
      icon: Close,
      action:  () => {
        navigate(`/connection/${connectionID}`)
      }
    }, ] 
     
 
  React.useEffect(() => {
    if(loaded) return
    setAppHistory({
      title: `${configKey} | ${tablename} | Columns`,
      path: `/table/${connectionID}/${schema}/${tablename}`,
      connectionID,
      schema,
      tablename
    });
    setLoaded(true)
  }, [configKey, loaded, connectionID, schema, tablename, setAppHistory])
 

  return <> 
  <ListGrid menuItems={saveMenu} breadcrumbs={breadcrumbs} commitRow={commitRow} title={`Columns in "${tablename}"`} 
      rows={data?.rows?.map(configRow)} />  
  </>

}

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

function HomePage ({ pinned }) {
  
  const [loaded, setLoaded] = React.useState(false) ;
  const { getConfigs, saveConfig  } = useConfig()
  const configs = getConfigs();
  const navigate = useNavigate();

 
  const {  setAppHistory, setModalState } = React.useContext(AppStateContext);
 
  
  React.useEffect(() => {
   
    if (loaded) return;
    setAppHistory({
      title: `Home`,
      path: `/` 
    });
  
    setLoaded(true)

  }, [ setAppHistory, loaded ])
  
 
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
      
  if (!rows.length) {
    return <Alert severity="warning">
      You do not have any connections created.  <Button size="small" endIcon={<Add />} variant="contained" onClick={openConnectionModal}>Click here</Button> to create one.
    </Alert>
  }

  return <ListGrid wide breadcrumbs={breadcrumbs} title="Available Connections" menuItems={saveMenu} rows={rows} />
}

function App() { 

  const [audioProp, setAudioProp] = React.useState(null) ;
  const [modalState, setModalState] = React.useState({
    open: false,
    connection: {  }, 
  });

  const {
    Alert,
    Confirm,
    Prompt, 
    ExpressionModal,
    modalProps,
  } = useModal()

  const props = useAppHistory(); 
  const { current } = props;

  const [pinnedTab, setPinnedTab] = React.useState(localStorage.getItem('pinned-tab')); 

  const pinTab = tab => { 
    setPinnedTab(tab);
    localStorage.setItem('pinned-tab', tab)
  }
 
  return (
    <AppStateContext.Provider value={{ 
        ...props, 
        audioProp,
        setAudioProp,
        Alert,
        Confirm,
        Prompt,
        ExpressionModal,
        setModalState 
      }}>
      <div className="App">
        {current?.title && <Helmet> 
            <title>MySQLNow | {current.title}</title> 
        </Helmet>}

        <BrowserRouter>
          <ToggleToolbar 
            setModalState={setModalState} 
            {...props} 
            pinnedTab={pinnedTab}
            setPinnedTab={pinTab}
          />
          <Area pinned={!!pinnedTab}> 
        {!!audioProp && <>Now playing: {audioProp}</>}
            <Routes>
              <Route path="/" element={<HomePage pinned={!!pinnedTab} />} /> 
              <Route path="/connection/:connectionID" element={<ConnectionGrid  />} /> 
              <Route path="/table/:connectionID/:schema/:tablename" element={<TableGrid  />} /> 
              <Route path="/query/:connectionID/:schema/:tablename" element={<QueryGrid  />} /> 
              <Route path="/lists/:connectionID/:schema/:tablename/:listname" element={<QueryGrid   />} /> 
              <Route path="/sql/:connectionID/:schema/:tablename/:listname" element={<QueryAnalyzer   />} /> 
              <Route path="/sql" element={<QueryAnalyzer   />} /> 
              <Route path="/json" element={<JsonTabs   />} /> 
            </Routes>
          </Area>
        </BrowserRouter>
        <Stack spacing={1} direction="row" sx={{ alignItems: 'center', width: 'calc(100vw - 24px)', p: 0, position: "absolute", bottom: 0, color: 'white'}}>
          <Box sx={{flexGrow: 1}}/>
          <SaveAs />
          <Typography variant="caption">MySQL<b>Now</b>.</Typography>
          <Typography variant="caption"><a style={{color: 'orange'}} rel="noreferrer" href="https://github.com/miltonejones/mui-sql-studio" target="_blank">Check out the repo</a>.</Typography>
        </Stack>
        <Modal {...modalProps} />
        <ConnectionModal onChange={(key, val) => {
          setModalState({ ...modalState, connection: {
            ...modalState.connection,
            [key]: val
          }})
        }} {...modalState} />
      {!!audioProp && <audio controls autoPlay style={{display: 'none'}}> 
        <source src={audioProp} type="audio/mpeg"/>
      Your browser does not support the audio element.
      </audio>}
      </div>
    </AppStateContext.Provider>
  );
}

export default App;
