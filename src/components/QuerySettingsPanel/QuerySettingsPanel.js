import * as React from 'react';
import { describeTable, connectToDb } from '../../connector/dbConnector';
import { AppStateContext } from '../../hooks/AppStateContext';
import { useQueryTransform } from '../../hooks/useQueryTransform';
import { Divider, Box, Breadcrumbs,Select, Autocomplete, Card,
  Link, FormControlLabel, Switch, Menu, Collapse, MenuItem, 
  TextField, Stack, Button, ToggleButtonGroup, ToggleButton, IconButton, Typography, styled} from '@mui/material';
import { Add, Remove, Delete, ExpandMore, PlayArrow, ArrowBack, ArrowForward, Close } from '@mui/icons-material';

import { Tooltag, RotateButton, SearchBox  } from '..'
const QuerySettingsContext = React.createContext({});
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

 


const AU = styled('u')(({ active, error }) => ({
  cursor: 'pointer',
  fontWeight: 600,
  fontStyle: 'italic',
  color: error ? 'red' : (active ? '#37a' : 'gray'), 
  '&:hover': {
    textDecoration: 'underlined',
    color: '#73a'
  }
}))

const CL = styled(AU)(({ active, error }) => ({
  position: 'relative',
  '& .cl': {  
    display: 'none'
  },
  // '&:hover': {
  //   display: 'none',
  //   '& .cl': { 
  //     display: 'block'
  //   }, ArrowBack, ArrowForward
  // }
}))

const CLink = ({children, onClick, onMove, ...props}) => {
  return <Tooltag title={
    <>
    <IconButton onClick={onClick}>
      <Delete />
    </IconButton>
    <IconButton onClick={() => onMove && onMove(false)}>
      <ArrowBack />
    </IconButton>
    <IconButton onClick={() => onMove && onMove(true)}>
      <ArrowForward />
    </IconButton>
    </>
  } component={AU} {...props}>
    {children} 
  </Tooltag>
}


export default function QuerySettingsPanel({ 
    config, 
    tablename, 
    configuration, 
    breadcrumbs,
    setConfiguration, 
    onCommit, 
    onCancel 
  }) {
  const [loaded, setLoaded] = React.useState(false) ; 
  const [tableNames, setTableNames] = React.useState([]);
  const [showTableNames, setShowTableNames] = React.useState(false);
  const [showFieldNames, setShowFieldNames] = React.useState(false);
  const [showSQL, setShowSQL] = React.useState(false);
  const { Prompt, Confirm, ExpressionModal } = React.useContext(AppStateContext);

  const transformer = useQueryTransform()

  const findTable = name => transformer.findTable(configuration.tables, name);  
 
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
    const maxIndex = configuration.tables.reduce(columnIndex, 0) || 0;
    const columns = rows.map((col, i) => ({
      name: col.COLUMN_NAME,
      alias: col.COLUMN_NAME ,
      index: i + maxIndex + 1
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

  const addGroupBy = (group) =>
    setConfiguration((f) => ({
      ...f,
      groups: f.groups.map((t) => (t.index === group.index ? group : t)),
    }));


  const dropOrderBy = async (ID) => {
    const ok = await Confirm(`Remove order by?`);
    if (!ok) return;
    setConfiguration((f) => ({
      ...f,
      orders: f.orders.filter(c => c.index !== ID)
    }));
  }

  
  const dropGroupBy = async (ID) => {
    const ok = await Confirm(`Remove group by?`);
    if (!ok) return;
    setConfiguration((f) => ({
      ...f,
      groups: f.groups.filter(c => c.index !== ID)
    }));
  }

  const editTable = async (name, edit) => {
    const table = findTable(name);
    await edit(table);
    updateTable(table);
  };

  const editColumn = async (name, field, edit) => {
    editTable(name, async (table) => {
      const column = table.columns.find((c) => c.name === field);
      await edit(column, table);
      table.columns = table.columns.map((c) => {
        c.index = c.index === undefined ? table.columns.filter(f => f.selected).length : c.index;
        return c.name === column.name ? column : c
      });
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
        table.alias,
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
        col.alias,
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

  const moveColumn = (name, col) => {
    editTable(name, (table) => {
     const column = table.columns.find (f => f.name === col);
     const tables = configuration.tables.map(t => {
      const tgt = t.columns.filter(c => c.index > column.index);
      if (!tgt.length) return t;
      const target = tgt[0]
      t.columns = t.columns.map(b => b.name === target.name ? {...b, index: column.index} : b)
      table.columns = table.columns.map(b => b.name === col ? {...b, index: target.index} : b)
      return t;
     })
     setConfiguration((f) => ({
       ...f,
       tables 
     }));
     alert (column.index)
    });
  }

  
  const openDb = async (s) => { 
    const res = await connectToDb(s);
    const tables = res.rows.map((f) => f[Object.keys(f)[0]]);
    setTableNames(tables); 
  };


  const columnList = (filter, small, Tag = CLink) => {
    const p = [];
    const names = [];

    configuration.tables.map(table => {
      table.columns.filter(filter).map(col => names.push(col.alias)) 
    });

    configuration.tables.map(table => {
      table.columns
      .sort((a,b) => a.index - b.index)
      .filter(filter).map((col, i) => {
        const error = names.filter(n => n === col.alias).length > 1;
        p.push(<>
          {table.alias}.<Tag 
            onMove={fwd => moveColumn(table.name, col.name)} 
            active={col.selected} 
            onClick={() => setColumnSelected(table.name, col.name)}>{col.name}</Tag>
            
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

  const newGroup = (group) => {
    setConfiguration((f) => ({
      ...f,
      groups: f.groups.concat(group)
    }));
  }

  const addExpression = (field) => {
    if (field.index) {
      return setConfiguration((f) => ({
        ...f,
        fields: (f.fields||[]).map((t) => (t.index === field.index ? field : t)),
      }));
    }
    setConfiguration((f) => ({
      ...f,
      fields: (f.fields||[]).concat({...field, index: uniqueId()})
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
    addGroupBy,
    dropGroupBy,
    dropTable,
    dropClause,
    dropOrderBy,
    ...configuration
  }}>
  {!!breadcrumbs && <>
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {breadcrumbs.map(crumb => crumb.href 
        ? <Link href={crumb.href}><Typography variant="body2">{crumb.text}</Typography></Link> 
        : <Typography variant="body2">{crumb.text}</Typography>)}
    </Breadcrumbs>
  </>}
  <Stack direction="row" sx={{alignItems: 'center'}}>
  <Typography variant="h6">Edit query for "{tablename}"</Typography>
      <Box sx={{flexGrow: 1}} />

    <Tooltag sx={{mr: 2}} color="warning" component={IconButton}  title="Run" onClick={() => onCommit && onCommit(createTSQL())}
      >
      <PlayArrow />
    </Tooltag>

    <Tooltag title="Return to list"  component={IconButton}  onClick={() => onCancel && onCancel()}
      >
      <Close />
    </Tooltag> 
    
  </Stack>

  <Divider >
    <ToggleButtonGroup exclusive value={showSQL ? "yes" : "no"} 
      color="primary"
      onChange={(e, n) =>  setShowSQL(n === 'yes')} size="small">
      <ToggleButton value="no">
        form
      </ToggleButton>
      <ToggleButton value="yes">
        sql
      </ToggleButton>
    </ToggleButtonGroup>  
  </Divider>

 {!showSQL && <SectionHeader expanded={showFieldNames} blank actionText="Add fields" onAdd={() => setShowFieldNames(!showFieldNames)}>
    { showSQL ? "SQL" : "SELECT" } 
  </SectionHeader> }
    
  <Collapse in={!showSQL}>
    
    <Box sx={{m: theme => theme.spacing(1, 0)}}>
    {columnList(z => !!z.selected)}
        {configuration.fields?.map(f => <>{f.expression} as <AU active onClick={async () => {
          const b = await ExpressionModal(f)
          if (!b) return;  
          addExpression({...f, ...b})
        }}>{f.name}</AU></>)}
    </Box> 

    <Collapse in={showFieldNames}>

      {!!columns.length && <>
        <Typography variant="caption">Available fields</Typography>
        <Box>
        {columnList(z => !z.selected, !0, AU)}
        </Box>
      </>}

      <Button endIcon={<Add />} size="small" variant="outlined"  
        onClick={async () => {
          const b = await ExpressionModal({})
          if (!b) return; 
          addExpression(b)
        }}
        sx={{mr: 1, mt: 1}}
        >add expression</Button>
     
    </Collapse> 

    <SectionHeader expanded={showTableNames}
      actionText="Add tables" onAdd={() => setShowTableNames(!showTableNames)}>
      FROM
    </SectionHeader>
 

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
    

    <SectionHeader disabled={configuration.wheres.length}  inactive={!configuration.wheres.length}
      actionText="Add where clause" onAdd={() => newClause({index: uniqueId()})}>
      WHERE
    </SectionHeader> 

    {configuration.wheres.map((where) => <WhereItem key={where.index} {...where} />)}

    {!!configuration.wheres.length && <>
      <Button endIcon={<Add />} size="small" variant="outlined" onClick={() => newClause({operator: 'AND', index: uniqueId()})} sx={{mr: 1}}>AND</Button>
      <Button endIcon={<Add />} size="small" variant="outlined" onClick={() => newClause({operator: 'OR', index: uniqueId()})}>OR</Button>
    </>}

    <Collapse in={configuration.orders.filter(f => !!f.fieldName).length}>
      

      <SectionHeader inactive={!configuration.groups.length} actionText="Add group by" onAdd={() => newGroup({index: uniqueId()})}>
        GROUP BY
      </SectionHeader> 


      {configuration.groups.map((group) => <GroupItem key={group.index} {...group} />)}


    </Collapse>


    <SectionHeader inactive={!configuration.orders.length} actionText="Add order by" onAdd={() => newSort({index: uniqueId(), direction: 'ASC'})}>
      ORDER BY
    </SectionHeader> 
 


    {configuration.orders.map((order) => <OrderItem key={order.index} {...order} />)}


{/* footer  */}
    <Divider  sx={{m: theme => theme.spacing(1, 0)}}/>

    <Stack direction="row" sx={{alignItems: 'center'}}>
      <Box  sx={{flexGrow: 1}}/>

      <Button size="small" sx={{mr: 1}} endIcon={ <Close />} onClick={() => onCancel && onCancel()}
       variant="outlined">
     close
    </Button>
    {!!onCommit && <Button color="warning" onClick={() => onCommit(createTSQL())} variant="contained"
      size="small" endIcon={<PlayArrow />}
    >run</Button>}

</Stack>

  </Collapse>
  

  <Collapse in={showSQL}>

  {/* <Divider  sx={{m: theme => theme.spacing(1, 0)}}/> */}
  <Card sx={{p: 2, maxWidth: 400 }}>
      <Typography><b>SQL Code</b></Typography>
      <Divider />
  <pre>
    {createTSQL()}
    </pre>

  </Card>

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

function SectionHeader({ children, inactive, blank, actionText, expanded, disabled, onAdd}) {

  const sx = inactive 
    ? {color: 'gray'}
    : {fontWeight: 600}
  return <>
  
  {!blank && <Divider sx={{m: theme => theme.spacing(1, 0)}}/>}

  <Stack direction="row" sx={{alignItems: 'center'}}>
    <Typography sx={sx}> {children} </Typography>
    <Box sx={{ flexGrow: 1 }}/>
    <Tooltag title={actionText} deg={ expanded ? 0 : 180 }
      component={RotateButton} onClick={onAdd} disabled={disabled}
      >
      {expanded ? <Remove /> : <Add />}
    </Tooltag>
  </Stack>

  </>
}
 

function GroupItem ({ index }) {
  const { tables, groups, orders, addGroupBy, dropGroupBy } = React.useContext(QuerySettingsContext);


  const thisGroupBy = groups.find(w => w.index === index);

  const setGroupBy = (name, value) => {
    const group = {
      ...thisGroupBy,
      [name]: value
    }
    addGroupBy(group)
  }

  const handleColumn = (clausecol) => {  
    setGroupBy('fieldName', clausecol) 
  };
  
  const { fieldName } = thisGroupBy;

  const label = fieldName || 'choose column';


  const columns = orders.map(f => f.fieldName); //tables.reduce(collateColumns, [])

  return <Stack direction="row" sx={{mb: 1, alignItems: 'center'}} spacing={1}>

    <Tooltag  component={IconButton} title="Delete order by" onClick={() => dropGroupBy(index)}>
    <Delete />
   </Tooltag>
 
    <QuickSelect options={columns} onChange={handleColumn} error={!fieldName} label="field" value={label}/> 

  </Stack>


}


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
 
    <QuickSelect options={columns} onChange={handleColumn} error={!fieldName} label="field" value={label}/>
    <QuickSelect options={['ASC', 'DESC']} onChange={handleDirection} label="direction" value={direction}/>

  </Stack>


}

function columnIndex(total, table) { 
  table.columns.map(col => total = Math.max(total, col.index || 1));
  return total
}

function collateColumns(columns, table) {
  table.columns.map(col => columns.push(`${table.alias}.${col.name}`))
  return columns
}

function selectedColumns(columns, table) {
  table.columns.filter(f => !f.selected).map(col => columns.push(`${table.alias}.${col.name}`))
  return columns
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
 
    {!!operator && <QuickSelect label="and/or" options={['OR', 'AND']} onChange={handleOperator}  value={operator}/>}
  <QuickSelect options={columns} label="field" onChange={handleClose} error={!fieldName} value={label}/>
    {" "}
    <QuickSelect options={predicates.map(e => e.name)} label="operator" onChange={handlePredicate} error={!predicate} value={predicate || 'predicate'}/>
  {predicate?.indexOf('NULL') < 0 &&  <TextField autoComplete="off" value={clauseProp}  onChange={handleProp} size="small" label="Compare to" placeholder="Enter value"/>}
  
  </Stack>
}


export const QuickSelect = ({ 
  label, 
  error, 
  value: selected, 
  options = [], 
  onChange 
}) => {

  const [filterText, setFilterText] = React.useState(null); 
  
 
  const handleChange = (event, value) => {
    onChange && onChange(value);
    setFilterText('')
  };

  const selections = options
  .filter(f => !filterText || f.toLowerCase().indexOf(filterText.toLowerCase()) > -1)

  return <> 
  
  <Autocomplete  
    disablePortal
    autoHighlight
    sx={{mr: 1, minWidth: 220}}
    size="small"
    value={selected} 
    options={selections}
    onChange={handleChange} 
    renderInput={(params) => <TextField {...params} label={label} placeholder="Filter options" size="small" />}
 />
  </>

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
  // const arrow = open ? <>&#9650;</> : <>&#9660;</>
  return <>
  <AU style={{marginRight: 4}} active error={error} onClick={handleClick}>{label}</AU> 
 
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
  const { dropTable, setTableJoin } = React.useContext(QuerySettingsContext);
  const { destTable, srcCol, destCol, type = 'JOIN' } = table.join ?? {}; 

  const handleType = (e) => {  
    if (!e) return;
    setTableJoin(table.name, 'type', e) 
  };
 

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

  {" "}<QuickMenu options={['JOIN', 'LEFT JOIN']} 
      onChange={handleType} value={type} label={type}/>
  {" "}
  <AU active onClick={() => addTable(table.name)}>
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