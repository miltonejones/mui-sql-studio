
import * as React from 'react';
import { 
  BrowserRouter,  
  Routes, 
  Route,
  useNavigate,
  useParams
} from "react-router-dom";
import './App.css';
import { ToggleToolbar, ListGrid, QuerySettingsPanel } from './components'
import { Alert, Box, Collapse, IconButton, Stack, Typography, styled } from '@mui/material';
import { useConfig } from './hooks/useConfig';
import { useAppHistory } from './hooks/useAppHistory';
import { execQuery } from './connector/dbConnector';

import { Add, Launch, Key, Close, Edit, SaveAs } from '@mui/icons-material';

export const AppStateContext = React.createContext({});

const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
function QueryGrid () {
  const navigate = useNavigate();
  const { schema,  tablename, connectionID } = useParams();
  const [queryText, setQueryText] = React.useState(`SELECT * FROM ${tablename}`)
  const [data, setData] = React.useState(null);
  const [page, setPage] = React.useState(1) ;
  const [edit, setEdit] = React.useState(false) ;
  const [loaded, setLoaded] = React.useState(false) ;
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID);


  const { setAppHistory} = React.useContext(AppStateContext);
 
  
  React.useEffect(() => {
   
  
    setAppHistory({
      title: `${configKey} / ${tablename} / List`,
      path: `/query/${connectionID}/${schema}/${tablename}`,
      connectionID,
      schema,
      tablename
    });
  

  }, [configKey, connectionID, tablename, schema, setAppHistory])
  


  const loadPage = React.useCallback (async (pg, sql) => {
    const f = await execQuery(configs[configKey], sql || queryText, pg);
    console.log ({ f })
    setPage(pg);
    setData(f); 
  }, [configs, configKey, queryText])

  const execQueryText = (text) => { 
    setQueryText(text)
    setEdit(false);
    loadPage(1, text);
  }

  React.useEffect(() => {
    if (!!loaded) return;
    loadPage(1) ;
    setLoaded(true)
  }, [data, loaded, loadPage]);

  const configRow = (conf) => Object.keys(conf).map(key => ({
    field: key,
    value: conf[key]
  }));
 
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
      text: 'List'
    }
  ] 

  const buttons = [
    <IconButton onClick={() => setEdit(!edit)}>
      <Edit />
    </IconButton>, 
    <IconButton onClick={() => navigate(`/table/${connectionID}/${schema}/${tablename}`)}>
      <Close />
    </IconButton>, 
  ]


  return <> 
  <Collapse in={!edit}>
    <ListGrid  
        setPage={loadPage}
        count={data?.count}
        page={page}
        buttons={buttons} 
        title={`${tablename}`} 
        breadcrumbs={breadcrumbs} 
        rows={data?.rows?.map(configRow)} 
      />  
  </Collapse>
  <Collapse in={edit}> 
    {edit && <QuerySettingsPanel onCommit={execQueryText} onCancel={() => setEdit(false)} config={configs[configKey]} tablename={tablename}/>}
  </Collapse>
  </>
}
 

function ColumnGrid () {
  const navigate = useNavigate();
  const [data, setData] = React.useState(null)
  const { schema,  tablename, connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)

  const { setAppHistory} = React.useContext(AppStateContext);
  
  
  const configRow = (conf) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [ 
      {
        field: 'Name', 
        value: conf.COLUMN_NAME,
        icon: !!conf.CONSTRAINT_NAME ? <Key color={ conf.CONSTRAINT_NAME === 'PRIMARY' ? "primary" : "warning"} /> : ''
      }, 
      {
        field: 'Position',
        value: conf.ORDINAL_POSITION
      },
      {
        field: 'Default',
        value: conf.COLUMN_DEFAULT
      },
      {
        field: 'Nullable',
        value: conf.IS_NULLABLE, 
      },
      {
        field: 'Type',
        value: !parts ? conf.COLUMN_TYPE : parts[1]
      }, 
      {
        field: 'Size',
        value: !parts ? '' : parts[2]
      }, 
    ]
  }
  

  React.useEffect(() => {
    if (!!data) return;
    (async() => {
      const f = await execQuery(configs[configKey], `SELECT
      u.CONSTRAINT_NAME, u.REFERENCED_TABLE_NAME, u.REFERENCED_COLUMN_NAME, 
      t.COLUMN_NAME,	t.ORDINAL_POSITION,	t.COLUMN_DEFAULT,	t.IS_NULLABLE,t.COLUMN_TYPE	 
      FROM INFORMATION_SCHEMA.COLUMNS t LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE u 
      ON u.TABLE_NAME = t.TABLE_NAME and u.COLUMN_NAME = t.COLUMN_NAME
      WHERE t.TABLE_NAME = '${tablename}' 
      GROUP BY t.ORDINAL_POSITION ORDER BY t.ORDINAL_POSITION `)
      setData(f);
    })()
  }, [configs, configKey, data, tablename, setAppHistory])
 

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
    <IconButton>
      <Add />
    </IconButton>,
    <IconButton onClick={() => navigate(`/query/${connectionID}/${schema}/${tablename}`)}>
      <Launch />
    </IconButton>
  ]

  React.useEffect(() => {
    setAppHistory({
      title: `${configKey} / ${tablename} / Columns`,
      path: `/table/${connectionID}/${schema}/${tablename}`,
      connectionID,
      schema,
      tablename
    });

  }, [configKey, connectionID, schema, tablename, setAppHistory])

  return <ListGrid buttons={buttons} breadcrumbs={breadcrumbs} title={`Columns in "${tablename}"`} 
      rows={data?.rows?.map(configRow)} />  

}



function ConnectionGrid () {
  const [data, setData] = React.useState(null)
  const { connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)
  const navigate = useNavigate();


  const { setAppHistory} = React.useContext(AppStateContext);
  
  React.useEffect(() => {
   
    setAppHistory({
      title: `Connections / ${configKey}`,
      path: `/connection/${connectionID}`,
      connectionID, 
    });
  

  }, [configKey, connectionID, setAppHistory])
  

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
    <IconButton>
      <Add />
    </IconButton>
  ]
  return <ListGrid breadcrumbs={breadcrumbs} title={`Tables in "${configKey}"`} buttons={buttons} rows={data?.rows?.map(configRow)} /> 

}

function HomePage ({ pinned }) {
  
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const navigate = useNavigate();



  const { setAppHistory} = React.useContext(AppStateContext);
 
  
  React.useEffect(() => {
   
  
    setAppHistory({
      title: `Home`,
      path: `/` 
    });
  

  }, [ setAppHistory ])
  


  const configRow = (conf) => [
    {
      field: 'title',
      value: conf.title,
      action: () => navigate(`/connection/${formatConnectName(conf.title)}`)
    },
    {
      field: 'host',
      value: conf.host,
      type: 'password'
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
  ]
  const rows = Object.keys(configs).map(f => configRow({...configs[f], title: f}));
  const buttons = [
    <IconButton>
      <Add />
    </IconButton>
  ]

  if (!rows.length) {
    return <Alert severity="warning">
      You do not have any connections created. Select All &gt; New Connection to create one.
    </Alert>
  }

  return <ListGrid breadcrumbs={breadcrumbs} title="Available Connections" buttons={buttons} rows={rows} />
}

const Area = styled(Box)(({ pinned }) => ({
  height: 'calc(100vh - 128px)',
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

  const props = useAppHistory(); 

  const [pinned, setPinned] = React.useState(false);
 
  return (
    <AppStateContext.Provider value={{ ...props }}>
      <div className="App">
        <BrowserRouter>
          <ToggleToolbar {...props} onPin={t => setPinned(!!pinned ? null : t)}/>
          <Area pinned={pinned}> 
            <Routes>
              <Route path="/" element={<HomePage pinned={pinned} />} /> 
              <Route path="/connection/:connectionID" element={<ConnectionGrid  />} /> 
              <Route path="/table/:connectionID/:schema/:tablename" element={<ColumnGrid  />} /> 
              <Route path="/query/:connectionID/:schema/:tablename" element={<QueryGrid  />} /> 
            </Routes>
          </Area>
        </BrowserRouter>
        <Stack spacing={1} direction="row" sx={{ alignItems: 'center', width: 'calc(100vw - 24px)', p: 1, position: "absolute", bottom: 0, color: 'white'}}>
          <Box sx={{flexGrow: 1}}/>
          <SaveAs />
          <Typography variant="caption"><b>MySQL Studio</b>.</Typography>
          <Typography variant="caption"><a style={{color: 'yellow'}} rel="noreferrer" href="https://github.com/miltonejones/mui-sql-studio" target="_blank">Check out the repo</a>.</Typography>
        </Stack>
      </div>
    </AppStateContext.Provider>
  );
}

export default App;
