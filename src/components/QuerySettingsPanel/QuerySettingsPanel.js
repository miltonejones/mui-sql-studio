import * as React from 'react';
import { describeTable, connectToDb } from '../../connector/dbConnector';
import { AppStateContext } from '../../hooks/AppStateContext';
import { useQueryTransform } from '../../hooks/useQueryTransform';
import { Divider, Box, FormControlLabel, Switch, Menu, Collapse, MenuItem, TextField, Stack, Button, IconButton, Typography, styled} from '@mui/material';
import { Add, Delete, ExpandMore, PlayArrow, Close } from '@mui/icons-material';

import { Tooltag  } from '..'
const QuerySettingsContext = React.createContext({});
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

 


const AU = styled('u')(({ active, error }) => ({
  cursor: 'pointer',
  color: error ? 'red' : (active ? '#37a' : 'gray'), 
  '&:hover': {
    textDecoration: 'underlined',
    color: '#73a'
  }
}))


export default function QuerySettingsPanel({ 
    config, 
    tablename, 
    configuration, 
    setConfiguration, 
    onCommit, 
    onCancel 
  }) {
  const [loaded, setLoaded] = React.useState(false) ; 
  const [tableNames, setTableNames] = React.useState([]);
  const [showTableNames, setShowTableNames] = React.useState(false);
  const [showFieldNames, setShowFieldNames] = React.useState(false);
  const [showSQL, setShowSQL] = React.useState(false);
  const { Prompt, Confirm } = React.useContext(AppStateContext);

  const transformer = useQueryTransform()

  const findTable = name => transformer.findTable(configuration.tables, name);  
  // const findAlias = name => transformer.findAlias(configuration.tables, name); 
  const createTSQL = () => transformer.createTSQL(configuration); 



  const dropTable = React.useCallback(async(ID) => {
    const ok = await Confirm(`Remove table?`);
    if (!ok) return;
    setConfiguration(f => ({
      ...f,
      tables: f.tables.filter(e => e.ID !== ID)
    }))
  }, [Confirm, setConfiguration])

  const addTable = React.useCallback(async (name, loading) => {
    const { rows } = await describeTable(config, name);
    const columns = rows.map((col, i) => ({
      name: col.COLUMN_NAME,
      alias: col.COLUMN_NAME 
    }));
    const table = { ID: uniqueId(), name, alias: name, columns };

    setConfiguration((f) => {
      if (f.tables.find(f => f.name === name) && loading) { 
        return f;
      }
      
      return {
        ...f,
        tables:
          f.tables.map((v) => v.name).indexOf(name) > -1
            ? f.tables.filter((t) => t.name !== name)
            : f.tables.concat(table),
      }
    });
  }, [config, setConfiguration]);

  // const decodeClause = (key, value) => {
  //   const clause = predicates.find(f => f.name === key)
  //   if (clause) {
  //     return clause.transform(value)
  //   }
  //   return value;
  // }

  const updateTable = (table) =>
    setConfiguration((f) => ({
      ...f,
      tables: f.tables.map((t) => (t.name === table.name ? table : t)),
    }));


  const addClause = (clause) =>
    setConfiguration((f) => ({
      ...f,
      wheres: f.wheres.map((t) => (t.index === clause.index ? clause : t)),
    }));


  const addOrderBy = (order) =>
    setConfiguration((f) => ({
      ...f,
      orders: f.orders.map((t) => (t.index === order.index ? order : t)),
    }));


  const editTable = async (name, edit) => {
    const table = findTable(name);
    await edit(table);
    updateTable(table);
  };

  const editColumn = async (name, field, edit) => {
    editTable(name, async (table) => {
      const column = table.columns.find((c) => c.name === field);
      await edit(column, table);
      table.columns = table.columns.map((c) =>
        c.name === column.name ? column : c
      );
    });
  };
  
  const setColumnSelected = (name, field) => {
    editColumn(name, field, (col) => {
      Object.assign(col, { selected: !col.selected });
    });
  };
  
  const setTableAlias = (name) => {
    editTable(name, async (table) => {
      const alias = await Prompt(
        `Enter an alias for ${name}`,
        table.alias
      );
      if (!alias) return;
      Object.assign(table, { alias });
    });
  };

  const setColumnAlias = (name, field) => {
    editColumn(name, field, async (col) => {
      const alias = await Prompt(
        `Enter an alias for ${col.name}`,
        col.alias
      );
      if (!alias) return;
      Object.assign(col, { alias });
    });
  };



  const setTableJoin = (name, field, value) => {
    editTable(name, (table) => {
      const join = table.join ?? {};
      Object.assign(join, { [field]: value });
      Object.assign(table, { join });
    });
  };

  
  const openDb = async (s) => { 
    const res = await connectToDb(s);
    const tables = res.rows.map((f) => f[Object.keys(f)[0]]);
    setTableNames(tables); 
  };


  const columnList = (filter, small) => {
    const p = [];
    const names = [];

    configuration.tables.map(table => {
      table.columns.filter(filter).map(col => names.push(col.alias)) 
    });

    configuration.tables.map(table => {
      table.columns.filter(filter).map((col, i) => {
        const error = names.filter(n => n === col.alias).length > 1;
        p.push(<>
          {table.alias}.<AU active={col.selected} onClick={() => setColumnSelected(table.name, col.name)}>{col.name}</AU>
          
            {!small && <> 
            {" "}<i>as</i>{" "}
            <AU active error={error} onClick={() => setColumnAlias(table.name, col.name)}>{col.alias}</AU>
            </>}, {" "}
          </>)
        }   
    )})
    return p.length ? p : ['*'];
  }
//  
  React.useEffect(() => { 
    if (!!loaded) return; 
    (async () => {
      await addTable(tablename, !0);
      await openDb(config)
    })();
    setLoaded(true)
  }, [addTable, config, loaded, tablename])
  
  const newClause = (clause) => {
    setConfiguration((f) => ({
      ...f,
      wheres: f.wheres.concat(clause)
    }));
  }

  const newSort = (order) => {
    setConfiguration((f) => ({
      ...f,
      orders: f.orders.concat(order)
    }));
  }

  const dropClause = async (ID) => {
    const ok = await Confirm(`Remove clause?`);
    if (!ok) return;
    setConfiguration((f) => ({
      ...f,
      wheres: f.wheres.filter(c => c.index !== ID)
    }));
  }
  const dropOrderBy = async (ID) => {
    const ok = await Confirm(`Remove order by?`);
    if (!ok) return;
    setConfiguration((f) => ({
      ...f,
      orders: f.orders.filter(c => c.index !== ID)
    }));
  }
  
  const columns = configuration.tables.reduce(selectedColumns, []) 


  const handleChange = async (event) => {
    setShowSQL(event.target.checked); 
  };

  if (!tablename) {
    return <>No table was entered.</>
  }

  return <QuerySettingsContext.Provider value={{
    setTableJoin,
    addClause,
    addOrderBy,
    dropTable,
    dropClause,
    dropOrderBy,
    ...configuration
  }}>


  <Stack direction="row" sx={{alignItems: 'center'}}>
    <Typography> {showSQL ? "SQL" : "SELECT"} </Typography>
    <Box  sx={{flexGrow: 1}}/>

    <FormControlLabel
        label="SQL"
        control={ <Switch 
        checked={showSQL}
        onChange={handleChange} 
        />}
      />
     
    <Tooltag component={IconButton}  title="Run" onClick={() => onCommit && onCommit(createTSQL())}
      >
      <PlayArrow />
    </Tooltag>
    
    {!!columns.length && <Tooltag title="Show available fields"  component={IconButton}  onClick={() => setShowFieldNames(!showFieldNames)}
      >
      <ExpandMore />
    </Tooltag>}
    
    <Tooltag title="Return to list"  component={IconButton}  onClick={() => onCancel && onCancel()}
      >
      <Close />
    </Tooltag>
    
  </Stack>
    
  <Collapse in={!showSQL}>
    
    <Box sx={{m: theme => theme.spacing(1, 0)}}>
    {columnList(z => !!z.selected)}
    </Box> 

    <Collapse in={showFieldNames}>

      {!!columns.length && <>
        <Typography variant="caption">Available fields</Typography>
        <Box>
        {columnList(z => !z.selected, !0)}
        </Box>
      </>}

    </Collapse>
    <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>


    <Stack direction="row" sx={{alignItems: 'center'}}>
      <Typography> FROM </Typography>
      <Box  sx={{flexGrow: 1}}/>
      <Tooltag title="Show available tables" component={IconButton} onClick={() => setShowTableNames(!showTableNames)}
        >
        <ExpandMore />
      </Tooltag>
    </Stack>
    

    <Stack>
      
      <Box sx={{mb: 1}}>
        {configuration.tables.map((t, k) => <TableItem first={k === 0} comma={k < (configuration.tables.length - 1)} key={t.name} table={t} addTable={addTable} setTableAlias={setTableAlias}/>)}
      </Box>

      <Collapse in={showTableNames}>
        <>
        
          <Typography variant="caption">Available tables</Typography>

          <Box>
            {tableNames.filter(t => !configuration.tables.find(c => c.name === t)).map(tname => <>
              <AU onClick={() => addTable(tname)}>{tname}</AU>, {" "}
            </>)}
          </Box>
        </>
      </Collapse>


    </Stack>
    
    <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>

    <Stack direction="row" sx={{alignItems: 'center'}}>
      <Typography sx={{color: configuration.wheres.length ? 'black' : 'gray'}}> WHERE </Typography>
      <Box  sx={{flexGrow: 1}}/>
    {!configuration.wheres.length && <Tooltag title="Add where clause"  component={IconButton}
        onClick={() => newClause({index: uniqueId()})}
        >
        <Add />
      </Tooltag>}
    </Stack>

    {configuration.wheres.map((where) => <WhereItem key={where.index} {...where} />)}

    {!!configuration.wheres.length && <>
      <Button endIcon={<Add />} size="small" variant="outlined" onClick={() => newClause({operator: 'AND', index: uniqueId()})} sx={{mr: 1}}>AND</Button>
      <Button endIcon={<Add />} size="small" variant="outlined" onClick={() => newClause({operator: 'OR', index: uniqueId()})}>OR</Button>
    </>}

    <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>

    <Stack direction="row" sx={{alignItems: 'center'}}>
      <Typography sx={{color: configuration.orders.length ? 'black' : 'gray'}}> ORDER BY </Typography>
      <Box  sx={{flexGrow: 1}}/>
      <Tooltag title="Add order by"  component={IconButton}
        onClick={() => newSort({index: uniqueId(), direction: 'ASC'})}
        >
        <Add />
      </Tooltag>
    </Stack>


    {configuration.orders.map((order) => <OrderItem key={order.index} {...order} />)}



    <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>

    {!!onCommit && <Button sx={{mr: 1}} onClick={() => onCommit(createTSQL())} variant="contained"
      size="small" endIcon={<PlayArrow />}
    >run</Button>}


<Button size="small" endIcon={ <Close />} onClick={() => onCancel && onCancel()}
       variant="outlined">
     close
    </Button>


  </Collapse>
  

  <Collapse in={showSQL}>

  <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>
    <pre>
    {createTSQL()}
    </pre>

  </Collapse>


  </QuerySettingsContext.Provider>
}

const predicates = [
  {
    name: 'EQUALS', 
    transform: (s) => `= '${s}'`
  },
  {
    name: 'DOES NOT EQUAL' , 
    transform: (s) => `<> '${s}'`
  },
  {
    name: 'IS GREATER THAN' , 
    transform: (s) => `> ${s}`
  },
  {
    name: 'IS LESS THAN' , 
    transform: (s) => `< ${s}`
  },
  {
    name: 'CONTAINS' , 
    transform: (s) => `LIKE '%${s}%'`
  },
  {
    name: 'STARTS WITH' , 
    transform: (s) => `LIKE '${s}%'`
  },
  {
    name: 'ENDS WITH' , 
    transform: (s) => `LIKE '%${s}'`
  },
  {
    name: 'IS NULL' , 
    transform: (s) => `IS NULL`
  },
  {
    name: 'IS NOT NULL' , 
    transform: (s) => `IS NOT NULL`
  },
]

function OrderItem ({ index }) {
  const { tables, orders, addOrderBy, dropOrderBy } = React.useContext(QuerySettingsContext);


  const thisOrderBy = orders.find(w => w.index === index);

  const setOrderBy = (name, value) => {
    const order = {
      ...thisOrderBy,
      [name]: value
    }
    addOrderBy(order)
  }

  const handleColumn = (clausecol) => {  
    setOrderBy('fieldName', clausecol) 
  };
 
  const handleDirection = (clausecol) => {  
    setOrderBy('direction', clausecol) 
  };
 
  const { fieldName, direction } = thisOrderBy;

  const label = fieldName || 'choose column';


  const columns = tables.reduce(collateColumns, [])

  return <Stack direction="row" sx={{mb: 1, alignItems: 'center'}} spacing={1}>

    <Tooltag  component={IconButton} title="Delete order by" onClick={() => dropOrderBy(index)}>
    <Delete />
   </Tooltag>
 
    <QuickMenu options={columns} onChange={handleColumn} error={!fieldName} label={label}/>
    <QuickMenu options={['ASC', 'DESC']} onChange={handleDirection}  label={direction}/>

  </Stack>


}

function collateColumns(total, num) {
  num.columns.map(col => total.push(`${num.alias}.${col.alias}`))
  return total
}

function selectedColumns(total, num) {
  num.columns.filter(f => !f.selected).map(col => total.push(`${num.alias}.${col.alias}`))
  return total
}

function WhereItem ({ index }) {
  const { tables, wheres, addClause, dropClause } = React.useContext(QuerySettingsContext);

 
  const handleClose = (clausecol) => {  
    setClause('fieldName', clausecol) 
  };
 
  const handlePredicate = (thus) => {  
    setClause('predicate', thus) 
  };
 
  const handleProp = (e) => {  
    setClause('clauseProp', e.target.value) 
  };
 
  const handleOperator = (e) => {  
    setClause('operator', e) 
  };
 
  const thisClause = wheres.find(w => w.index === index);

  const setClause = (name, value) => {
    const clause = {
      ...thisClause,
      [name]: value
    }
    addClause(clause)
  }

  const columns = tables.reduce(collateColumns, [])

  const { fieldName, predicate, clauseProp, operator } = thisClause;

  const label = fieldName || 'choose column';

  return <Stack direction="row" sx={{mb: 1, alignItems: 'center', minHeight: 24}}>
   <Tooltag title="Delete where clause" component={IconButton} onClick={() => dropClause(index)}>
    <Delete />
   </Tooltag>
 
    {!!operator && <QuickMenu options={['OR', 'AND']} onChange={handleOperator}  label={operator}/>}
  <QuickMenu options={columns} onChange={handleClose} error={!fieldName} label={label}/>
    {" "}
    <QuickMenu options={predicates.map(e => e.name)} onChange={handlePredicate} error={!predicate} label={predicate || 'predicate'}/>
  {predicate?.indexOf('NULL') < 0 &&  <TextField autoComplete="off" value={clauseProp}  onChange={handleProp} size="small" label="Compare to" placeholder="Enter value"/>}
  
  </Stack>
}

export const QuickMenu = ({ label, error, value: selected, options, onChange }) => {

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (value) => {  
    onChange && onChange(value)
    setAnchorEl(null);
  };
 
  return <>
  <AU style={{marginRight: 8}} active error={error} onClick={handleClick}>{label}</AU>
 
  <Menu 
    anchorEl={anchorEl}
    open={open}
    onClose={() => handleClose()} 
  > 
    {options?.map (option => <MenuItem key={option} onClick={() => handleClose(option)}
    >{selected === option && <>&bull;{" "}</>}{option}</MenuItem>)} 
  </Menu>
  </>

}


function TableItem ({ first, table, comma , addTable, setTableAlias}) {
  const { dropTable } = React.useContext(QuerySettingsContext);
  const { destTable, srcCol, destCol } = table.join ?? {}; 
  if (first) {
    return <>
    <AU active onClick={() => addTable(table.name)}>
      {table.name}
    </AU> <i>as</i> <AU active onClick={() => setTableAlias(table.name)}>{table.alias}</AU>  
    </>
  }
  return <Box >
    <Tooltag  component={IconButton} title="Delete table join"  onClick={() => dropTable(table.ID)}>
    <Delete />
   </Tooltag>

  {" "}<i>JOIN</i> <AU active onClick={() => addTable(table.name)}>
    {table.name} 
  </AU> <i>as</i> <AU active onClick={() => setTableAlias(table.name)}>{table.alias}</AU>  
  {" "}<i>ON</i> {table.alias}.<ColumnMenu fieldname="srcCol" source={table.name} tablename={table.name} columnname={srcCol} /> 
  {" "}={" "} 
  <TableMenu fieldname="destTable" tablename={table.name} name={destTable} />
  .
  <ColumnMenu fieldname="destCol" source={destTable} tablename={table.name} columnname={destCol} /> 
  </Box>
}


function ColumnMenu ({ tablename, source, columnname, fieldname }) {
  const { tables, setTableJoin } = React.useContext(QuerySettingsContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (joinedcol) => { 
    !!joinedcol && setTableJoin(tablename, fieldname, joinedcol)
    setAnchorEl(null);
  };
 
  const selectedTable = tables.find(t => t.name === source);
  if (!selectedTable) {
    return <>no table</>
  }
  const columns = selectedTable.columns;
  const label = columnname || <i>choose column</i> 
  return <>
    <AU active error={!columnname} onClick={handleClick}>{label}</AU>
   
    <Menu 
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()} 
      > 
        {columns?.map (column => <MenuItem key={column.name} onClick={() => handleClose(column.name)}>{column.name}</MenuItem>)} 
      </Menu>
  </>;
}

function TableMenu ({ tablename, name, fieldname }) {
  const { tables, setTableJoin } = React.useContext(QuerySettingsContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (joinedtable) => { 
    !!joinedtable && setTableJoin(tablename, fieldname, joinedtable)
    setAnchorEl(null);
  };


  const label = name || <i>choose table</i> 
  return <>
    <AU active error={!name} onClick={handleClick}>{label}</AU>
    <Menu 
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()} 
      >
        {tables?.map (table => <MenuItem key={table.name} onClick={() => handleClose(table.name)}>{table.name}</MenuItem>)} 
      </Menu>
  </>;
}