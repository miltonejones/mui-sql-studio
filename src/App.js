
import * as React from 'react';
import { 
  BrowserRouter,  
  Routes, 
  Route,
  useNavigate,
  useParams
} from "react-router-dom";
import './App.css';
import Modal, { useModal } from './components/Modal/Modal';
import { ToggleToolbar, ListGrid, ConnectionModal, Tooltag, QuerySettingsPanel } from './components'
import { Alert,  Box, Button, Collapse, IconButton, Stack, Typography, styled } from '@mui/material';
import { useConfig } from './hooks/useConfig';
import { useSaveQuery } from './hooks/useSaveQuery';
import { useAppHistory } from './hooks/useAppHistory';
import { AppStateContext } from './hooks/AppStateContext';
import { useQueryTransform } from './hooks/useQueryTransform';
import { execQuery  } from './connector/dbConnector';
import {Helmet} from "react-helmet";

import { Add, Launch, Key, Close, FilterAlt, SaveAs, Save, Delete } from '@mui/icons-material';
 

const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
const EMPTY_CONFIGURATION = {
  tables: [],
  wheres: [],
  orders: [],
  groups: [],
};

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


  const { setAppHistory, Prompt, Confirm } = React.useContext(AppStateContext);
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
      let i = 0;
      const fixed = {
        ...conf,
        tables: conf.tables.map(t => {
          t.columns = t.columns.map(c => {
            if (c.selected) {
              c.index = i++;
            }
            return c;
          })
          return t;
        })
      }
 
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

  const saveBtn = saveEnabled ? [
  <Tooltag title="Delete List" component={IconButton} onClick={() => deletePage(configuration.title)}>
    <Delete />
  </Tooltag>,
  <Tooltag title="Save List" component={IconButton} onClick={savePage}>
    <Save />
  </Tooltag>] : []

  const buttons = saveBtn.concat([
    <Tooltag title="Set list filters" component={IconButton} onClick={() => {
      // setData(null);
      setEdit(!edit)
    }}>
      <FilterAlt />
    </Tooltag>, 
    <Tooltag  title="Close" component={IconButton} onClick={() => navigate(`/table/${connectionID}/${schema}/${tablename}`)}>
      <Close />
    </Tooltag>, 
  ]);


  return <> 
  <Collapse in={!edit}> 
  {/* <pre>
    {JSON.stringify(data?.fields,0,2)}
  </pre>
  <pre>
    {JSON.stringify(configuration.orders,0,2)}
  </pre>
  <pre>
    {JSON.stringify(data?.rows,0,2)}
  </pre> */}

    <ListGrid  
      dense
      onSearch={createAdHoc}
      onSort={orderAdHoc}
      onClear={dropAdHoc} 
      dropOrder={dropOrder}
      sorts={configuration.orders}
      searches={configuration.wheres}
      searchable={saveEnabled}
      setPage={loadPage}
      count={data?.count}
      page={page}
      buttons={buttons} 
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

  const { Alert, Confirm, setAppHistory} = React.useContext(AppStateContext);
  

  
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

  const buttons = [
    <IconButton onClick={() => navigate(`/query/${connectionID}/${schema}/${tablename}`)}>
      <Launch />
    </IconButton>,
    <IconButton onClick={() => Alert('Add column not implemented')}>
      <Add />
    </IconButton>,
    <IconButton onClick={() => navigate(`/connection/${connectionID}`)}>
      <Close />
    </IconButton>
  ]
 
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
  <ListGrid buttons={buttons} breadcrumbs={breadcrumbs} commitRow={commitRow} title={`Columns in "${tablename}"`} 
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
      const f = await execQuery(configs[configKey], ` SELECT
      TABLE_NAME,	TABLE_TYPE,	TABLE_ROWS, AUTO_INCREMENT,	CREATE_TIME, UPDATE_TIME
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE table_schema = '${configs[configKey].database}' ORDER BY TABLE_NAME `)
      setData(f);
    })()
  }, [configs, configKey, data])


  const configRow = (conf) => [
    {
      field: 'Open',
      icon: <Launch />,
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

  const buttons = [
    <IconButton onClick={() => Alert('Add table not implemented')}>
      <Add />
    </IconButton>,
    <IconButton onClick={() => navigate('/')}>
      <Close />
    </IconButton>
  ]
  return <ListGrid breadcrumbs={breadcrumbs} title={`Tables in "${configKey}"`} buttons={buttons} rows={data?.rows?.map(configRow)} /> 

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
      field: 'title',
      value: conf.title,
      action: () => navigate(`/connection/${formatConnectName(conf.title)}`)
    },
    {
      field: 'host',
      value: conf.host, 
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


  const openConnectionModal = () => {
    setModalState({
      open: true,
      connection: { title: 'New Connection', host: '', user: '', password: ''},
      onClose: async (c) => { 
        !!c && saveConfig(c)
        setModalState({ open: false })
      }
    })
  };

  
  const rows = Object.keys(configs).map(f => configRow({...configs[f], title: f}));
  const buttons = [
    <IconButton onClick={openConnectionModal}>
      <Add />
    </IconButton>
  ]

  if (!rows.length) {
    return <Alert severity="warning">
      You do not have any connections created.  <Button size="small" endIcon={<Add />} variant="contained" onClick={openConnectionModal}>Click here</Button> to create one.
    </Alert>
  }

  return <ListGrid breadcrumbs={breadcrumbs} title="Available Connections" buttons={buttons} rows={rows} />
}

const Area = styled(Box)(({ pinned }) => ({
  height: 'calc(100vh - 112px)',
  backgroundColor: 'white',
  outline: 'dotted 1px blue',
  position: 'absolute',
  top: 40,
  left: pinned ? 340 : 0,
  width: !pinned ? 'calc(100vw - 48px)' : 'calc(100vw - 388px)',
  transition: 'left 0.1s linear', 
  padding: 24,
  overflow: 'auto'
}))

function App() { 

  const [modalState, setModalState] = React.useState({
    open: false,
    connection: {  }, 
  });

  const {
    Alert,
    Confirm,
    Prompt, 
    modalProps,
  } = useModal()

  const props = useAppHistory(); 
  const { current } = props;

  const [pinned, setPinned] = React.useState(false);
 
  return (
    <AppStateContext.Provider value={{ 
        ...props, 
        Alert,
        Confirm,
        Prompt,
        setModalState 
      }}>
      <div className="App">
        {current?.title && <Helmet> 
            <title>MySQLNow | {current.title}</title> 
        </Helmet>}

        <BrowserRouter>
          <ToggleToolbar setModalState={setModalState} {...props} onPin={t => setPinned(!!pinned ? null : t)}/>
          <Area pinned={pinned}> 
            <Routes>
              <Route path="/" element={<HomePage pinned={pinned} />} /> 
              <Route path="/connection/:connectionID" element={<ConnectionGrid  />} /> 
              <Route path="/table/:connectionID/:schema/:tablename" element={<TableGrid  />} /> 
              <Route path="/query/:connectionID/:schema/:tablename" element={<QueryGrid  />} /> 
              <Route path="/lists/:connectionID/:schema/:tablename/:listname" element={<QueryGrid   />} /> 
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

      </div>
    </AppStateContext.Provider>
  );
}

export default App;
