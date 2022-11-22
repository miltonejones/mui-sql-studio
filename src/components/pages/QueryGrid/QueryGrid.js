import React from 'react';
import { Typography, Collapse } from '@mui/material';
import { ListGrid, QuerySettingsPanel } from '../../';
import { useParams } from "react-router-dom";
import { useConfig } from '../../../hooks/useConfig';
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName, EMPTY_CONFIGURATION } from '../../../util';
import { useSaveQuery } from '../../../hooks/useSaveQuery';
import { execQuery } from '../../../connector/dbConnector';
import { Launch, Close, Delete, Save, Info, FilterAlt } from '@mui/icons-material';
import { useQueryTransform } from '../../../hooks/useQueryTransform';
import { useNavigation } from '../../../hooks/AppStateContext';
 

function QueryGrid () {

  const { navigate } = useNavigation(); 

  const { schema, tablename, listname, connectionID } = useParams();
  const { createTSQL } = useQueryTransform()


  const [configuration, setConfiguration] = React.useState(EMPTY_CONFIGURATION);
  const [queryText, setQueryText] = React.useState(`SELECT * FROM ${tablename}`);
  const [empty, setEmpty] = React.useState(false);
  // const [data, setData] = React.useState(null);
  const [page, setPage] = React.useState(1) ;
  const [edit, setEdit] = React.useState(false) ;
  // const [loaded, setLoaded] = React.useState(false) ;
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID);


  const { 
    queryState, 
    setQueryState,
    setAppHistory, 
    Alert, 
    Prompt, 
    Confirm, 
    setPageSize, 
    pageSize: ps = 100,
    setBreadcrumbs 
  } = React.useContext(AppStateContext);
  const pageSize = ps === undefined || ps === 'undefined' 
    ? 100
  : ps;

  const { loaded, data } = queryState;
  const setLoaded = React.useCallback(e => setQueryState(s => ({...s, loaded: e})), [setQueryState]);
  const setData = React.useCallback( e => setQueryState(s => ({...s, data: e})), [setQueryState]);

  const saveEnabled = !!configuration.tables.length

  const { saveQuery, deleteQuery, getQueries } = useSaveQuery();
 
  
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

  const chagePageSize = size => {
    setPageSize(size);
    loadPage(1, queryText, size);
  }


  const loadPage = React.useCallback (async (pg, sql, size) => {  
    setData(null); 
    setEmpty(false);
    const f = await execQuery(configs[configKey], sql || queryText, pg, size || pageSize); 
    setPage(pg);
    setData(f); 
    setEmpty(!f?.rows?.length)
  
  }, [configs, configKey, queryText, setData, pageSize])

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
  }, [data, loaded, loadPage, setLoaded, getQueries, listname]);

  const configRow = (conf, fields) => Object.keys(conf).map(key => ({
    field: key,
    value: conf[key],
    menu: [
      {
        label: `Find ${key} matching "${conf[key]}"`,
        action: () => createAdHoc(key, `${conf[key]}`)
      },
      {
        label: `Find ${key} containing "${conf[key]}"`,
        action: () => createAdHoc(key, `*${conf[key]}*`)
      },
      { 
        label: `Find ${key} starting with "${conf[key]}"`,
        action: () => createAdHoc(key, `${conf[key]}*`)
      },
      { 
          label: `Find ${key} ending with "${conf[key]}"`,
        action: () => createAdHoc(key, `*${conf[key]}`)
      }
  ],
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
    hide: !0,
    action: () => deletePage(configuration.title)
  },
  {
    title: "Save List",
    icon: Save,
    action: savePage
  },
  {
    title: 'Open in Query Analyzer',
    hide: !0,
    icon: Launch,
    action:  () => {
      navigate(`/sql/${connectionID}/${schema}/${tablename}/${listname}`)
    }
  }, ] : []
  
  const menuItems = saveMenu.concat([
    {
      title: 'Show SQL',
      icon: Info,
      hide: !0,
      action: () => Alert(<pre>{queryText}</pre>, 'SQL Code')
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
 
  React.useEffect(() => {
   
    setBreadcrumbs(breadcrumbs);
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
   

  }, [configKey, loaded, breadcrumbs, setBreadcrumbs, getQueries, connectionID, tablename, schema, listname, setAppHistory])
  

  return <> 

    {!!data?.error && <> 
      <Typography>{data.error.code}</Typography>
      {/* <Alert severity="error">{JSON.stringify(data.error.sqlMessage)}</Alert> */}
    </>}

  <Collapse in={!edit}>   
    <ListGrid  
      dense
      wide 
      pageSize={pageSize}
      setPageSize={chagePageSize}
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
  

QueryGrid.defaultProps = {};
export default QueryGrid;
