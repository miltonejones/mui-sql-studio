import React from 'react'; 
import { ListGrid, QuickMenu, TinyButton, Flex, Tooltag, TextBtn } from '../../';
import { Stack, Box, Typography, Link , Divider} from '@mui/material';
import { useNavigate, useParams } from "react-router-dom";
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { useConfig } from '../../../hooks/useConfig';
import { Launch, Add, Save, Remove, Close, Key, Delete } from '@mui/icons-material';
import { execQuery, execCommand, describeConnection, describeTable } from '../../../connector/dbConnector';
 
function ConstraintInfo({ 
      connectionID, 
      schema, 
      conf, 
      configuration,
      addConstraint, 
      dropConstraint
    }) {
  const [showForm, setShowForm] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [state, setState] = React.useState({
    columns: null,
    table: null,
    field: null,
  });
  const { table, field, columns } = state;

  const openForm = async () => {
    const f = await describeConnection(configuration)
    setData(f.rows.map(e => e.TABLE_NAME));
    setShowForm(!0)
  }

  const openTable = async (name) => {
    const { rows } = await describeTable(configuration, name);
    const cols = rows.map(r => r.COLUMN_NAME);
    setState({...state, table: name, columns: cols})
  }

  if (showForm && !!data) {
    return <>
    <Box sx={{p: t => t.spacing(1,2)}}><Typography variant="caption"><b>Add constraint</b></Typography></Box>
    <Divider sx={{mb: 1}}/>
    <Stack sx={{p: t => t.spacing(0,2), minWidth: 180}}>
      <Typography variant="caption">Reference table</Typography>
      <Box sx={{mb: 1}}><QuickMenu options={data} label={table || "Choose"} onChange={b => {
        if (!b) return;
        openTable(b);
      }} /></Box>
      {!!columns && <>
      
        <Typography variant="caption">Reference column</Typography>
      <Box><QuickMenu options={columns} label={field || "Choose"} onChange={b => {
        if (!b) return;
        setState({...state, field: b})
      }} /></Box></>}
    </Stack>
    <Divider sx={{mb: 1, mt: 1}}/>
    <Flex sx={{ p: t => t.spacing(0,2,2,0) }}
    ><Box sx={{flexGrow: 1}} /> 
    <TinyButton onClick={() => {
      setState({
        columns: null,
        table: null,
        field: null,
      })
      setData(null);
    }} icon={Close} /> 
    
    {!!(table && field) && <TinyButton onClick={() => addConstraint && addConstraint({...state, source: conf.COLUMN_NAME})} icon={Save} />}
    </Flex>
    </>
  }

  if (!conf.REFERENCED_TABLE_NAME) {
    return <Stack sx={{p: 2}}>
      <TextBtn endIcon={<Add />} variant="contained" onClick={openForm}>Add constraint</TextBtn>
    </Stack>
  }
  return <>
  <Stack sx={{minWidth: 300}}>
    <Typography sx={{ p: t => t.spacing(2,2,0,2) }} variant="caption">Constraint <b>{conf.CONSTRAINT_NAME}</b></Typography> 
    <Typography sx={{ p: t => t.spacing(0,2,0,2) }}
      ><Tooltag component={Link} title="Open reference table" 
          href={`/table/${connectionID}/${schema}/${conf.REFERENCED_TABLE_NAME}`}
        >{conf.REFERENCED_TABLE_NAME}</Tooltag>.{conf.REFERENCED_COLUMN_NAME}</Typography>
    <Divider sx={{mb: 1}}/>
    <Flex sx={{ p: t => t.spacing(0,0,2,0) }}
    ><Box sx={{flexGrow: 1}} />
    <Typography variant="caption"><Link sx={{cursor: 'pointer'}}
     onClick={() => dropConstraint(conf.CONSTRAINT_NAME)}
      >Drop Constraint</Link></Typography>
    <TinyButton onClick={() => dropConstraint(conf.CONSTRAINT_NAME)} icon={Delete} /> </Flex>
  </Stack>
  </>
}

function TableGrid () {
  // const [loaded, setLoaded] = React.useState(false) ;
  // const [data, setData] = React.useState(null);

  const navigate = useNavigate();
  const [create, setCreate] = React.useState(false)
  const { schema,  tablename, connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)

  const { queryState, setQueryState, Alert, Confirm, Prompt, setAppHistory, setBreadcrumbs } = React.useContext(AppStateContext);
  

  const { loaded, data } = queryState;
  const setLoaded = React.useCallback(e => setQueryState(s => ({...s, loaded: e})), [setQueryState]);
  const setData = React.useCallback( e => setQueryState(s => ({...s, data: e})), [setQueryState]);


  
  const configRow = (conf) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [ 
      {
        field: 'Name', 
        value: conf.COLUMN_NAME,
        icon: !!conf.CONSTRAINT_NAME ? <Key color={ conf.CONSTRAINT_NAME === 'PRIMARY' ? "primary" : "warning"} /> : '',
        edit: !0,
        popover: <ConstraintInfo dropConstraint={dropConstraint} addConstraint={addConstraint} configuration={configs[configKey]} conf={conf} connectionID={connectionID} schema={schema} /> 
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

  const locate = (row, key) => row.find(f => f.field === key).value; 

  const deleteSQL = async (sql, message, title) => {
    
    const ok = await Prompt(<>
      <Typography variant="caption">{sql}</Typography>
      <Box>
      {message} This action cannot be undone! To confirm this action type <i>delete</i> in the box below.
      </Box>
    </>, title || 'Confirm delete', null, null, 'Type "delete"');


    if (ok === 'delete') {
      const res = await execCommand(configs[configKey], sql);
      if (res.error) {
        return Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
      }
      return await loadTable();
    }

    Alert ('operation cancelled')
  }

  const executeSQL = async (sql) => {
    const ok = await Confirm(sql);
    if (!ok) return;
    const res = await execCommand(configs[configKey], sql);
    if (res.error) {
      return Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
    }
    setCreate(false)
    await loadTable();
  }

  const dropConstraint = async (constraint_name) => {
    const sql = `ALTER TABLE ${tablename} DROP FOREIGN KEY ${constraint_name}`;
    await deleteSQL(sql, 'Drop foreign key?');
  }

  const addConstraint = async ({ table, field, source }) => {
    const sql = `ALTER TABLE ${tablename} ADD FOREIGN KEY (${source}) REFERENCES ${table}(${field})`;
    await executeSQL(sql);
  }

 
  const dropRow = async (data) => {
    const command = [`ALTER TABLE ${tablename}`]; 
    const name = locate(data, 'Name');
    command.push(`DROP COLUMN ${name}`)
    const sql = command.join(' ');
    await deleteSQL(sql, `Delete column "${name}"?`);
  }

  const commitRow = async ({ data: new_def, row: old_def, create}) => {  
    const command = [`ALTER TABLE ${tablename}`];

    // if (create) {
   console.log ({ new_def, old_def })
    // }

    command.push (
      locate(old_def, "Name") === locate(new_def, "Name") || create
        ? `${create ? 'ADD' : 'MODIFY'} COLUMN ${locate(create ? new_def : old_def, "Name")}`
        : `CHANGE COLUMN ${locate(old_def, "Name")} ${locate(new_def, "Name")}`,
      locate(new_def, "Type")
    );
    !!locate(new_def, "Size") && !!locate(new_def, "Size").trim() && 
      command.push(`(${locate(new_def, "Size")})`);
    command.push(locate(new_def, "Nullable") === 'YES' ? "NULL" : "NOT NULL");
    !!locate(new_def, "Default") && command.push (`DEFAULT "${locate(new_def, "Default")}"`);
    const sql = command.join(' ');
    await executeSQL(sql);
  }
  
  const loadTable = React.useCallback(async() => {
    setData(null)
    const f = await execQuery(configs[configKey], `SELECT
    u.CONSTRAINT_NAME, u.REFERENCED_TABLE_NAME, u.REFERENCED_COLUMN_NAME, 
    t.COLUMN_NAME,	t.ORDINAL_POSITION,	t.COLUMN_DEFAULT,	t.IS_NULLABLE,t.COLUMN_TYPE	 ,
    t.DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS t LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE u 
    ON u.TABLE_NAME = t.TABLE_NAME and u.COLUMN_NAME = t.COLUMN_NAME
    WHERE t.TABLE_NAME = '${tablename}' 
    GROUP BY t.ORDINAL_POSITION ORDER BY t.ORDINAL_POSITION `)
    setData(f);
  }, [configs, configKey, tablename, setData]);

  React.useEffect(() => {
    if (loaded || !!data) return;
    loadTable();
  }, [ data, loadTable, loaded ])
 

  const breadcrumbs = React.useMemo(() => [
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
  ] , [configKey, tablename, connectionID])

  const saveMenu =  [
    { 
      title: 'Open Table',
      icon: Launch,
      action:  () => {
        navigate(`/query/${connectionID}/${schema}/${tablename}`)
      }
    },  
    {
      title: create ? 'Cancel' :  "Add Column",
      icon: create ? Remove : Add,
      deg: create ? 0 : 180,
      action: () => setCreate(!create), // Alert('Add column not implemented')
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

    setBreadcrumbs(breadcrumbs);
    setLoaded(true)
  }, [configKey, loaded, breadcrumbs, connectionID, setLoaded, schema, tablename, setBreadcrumbs, setAppHistory])
 
  return <> 
  <ListGrid create={create} 
      onDelete={dropRow}
      allowDelete
      menuItems={saveMenu} breadcrumbs={breadcrumbs} commitRow={commitRow} title={`Columns in "${tablename}"`} 
      rows={data?.rows?.map(configRow)} />   
  </>
}
 

TableGrid.defaultProps = {};
export default TableGrid;
