import * as React from 'react';
import { describeTable, connectToDb, execQuery } from '../../connector/dbConnector';
import { AppStateContext } from '../../hooks/AppStateContext';
import { useQueryTransform } from '../../hooks/useQueryTransform';
import { Divider, Box, Breadcrumbs,Select, Autocomplete, Card,
  Link, FormControlLabel, Switch, Menu, Collapse, MenuItem, 
  TextField, Stack, Button, ToggleButtonGroup, ToggleButton, 
  IconButton, Typography, styled } from '@mui/material';
import { Add, UnfoldMore, Speed, Remove,  Sync, CheckCircle,
  Error, Delete, ExpandMore, PlayArrow, ArrowBack, ArrowForward, Close } from '@mui/icons-material';

import { Tooltag, RotateButton, SearchBox  } from '..'
import '../ListGrid/ListGrid.css';



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

const Pane = styled(Box)(({ theme }) => ({
  width: 320,
  height: 300, 
  overflow: 'auto', 
  border: 'solid 1px #d5d5d5',
  padding: theme.spacing(0.5), 
  borderRadius: 5
}))
 
const Item = styled(Box)(({ theme, active }) => ({
  borderRadius: 5,
  padding: theme.spacing(0.5), 
  margin: theme.spacing(0.5, 0), 
  cursor: 'default', 
  fontWeight: active ? 600 : 400,
  border: active ? 'solid 1px #d5d5d5' : 'solid 1px white',
  backgroundColor: active ? 'aliceblue' : ''
}))
 
export default function QuerySettingsPanel({ 
    config, 
    tablename, 
    configuration, 
    breadcrumbs,
    setConfiguration, 
    onCommit, 
    onCancel 
  }) {
  const [exclusive, setExclusive] = React.useState(true) 
  const [loaded, setLoaded] = React.useState(false) ; 
  const [tableNames, setTableNames] = React.useState([]);
  const [showTableNames, setShowTableNames] = React.useState(false);
  const [showFieldNames, setShowFieldNames] = React.useState(false);
  const [orderMode, setOrderMode] = React.useState(false);
  const [showSQL, setShowSQL] = React.useState(false);
  const { Alert, Prompt, Confirm, ExpressionModal } = React.useContext(AppStateContext);

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
  }, [config, setConfiguration, configuration.tables]); 

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
    editColumn(name, field, (col, table) => {
      Object.assign(col, { selected: !col.selected });
      const node = {
        objectname: table.name,
        objectalias: table.alias ,
        ...col
      }
      appendOrderItem(node) 
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
    editColumn(name, field, async (col, table) => {
      const alias = await Prompt(
        `Enter an alias for ${col.name}`,
        col.alias,
        col.alias
      );
      if (!alias) return;
      Object.assign(col, { alias });
      setConfiguration((f) => ({
        ...f,
        columnMap: f.columnMap?.map(c => c.name === col.name && c.objectname === table.name 
          ? ({...c, alias})
          : c)
      }));
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

  const openColumnOrderPanel = () => {
    const { columnMap = [] } = configuration; 
    if (!columnMap.length) {
      const selectedItems = collateTables(f => !!f.selected);  
      setConfiguration((f) => ({
        ...f,
        columnMap: selectedItems
      }));
    }
    
    setConfiguration((f) => ({
      ...f,
      columnMap: f.columnMap.map(c => ({...c, clicked: !1}))
    }));
    setOrderMode(!orderMode);
  }

  const clickOrderItem = o => {
    setConfiguration((f) => ({
      ...f,
      columnMap: f.columnMap.map((c, i) => i === o ? {...c, clicked: !c.clicked} : {...c, clicked: exclusive ? !1 : c.clicked})
    }));
  }


  function arraymove(arr, fromIndex, toIndex) {
    if (toIndex > -1 && toIndex < arr.length) {
      var element = arr[fromIndex];
      arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, element);
    } 
  }

  const appendOrderItem = col => {
    const { columnMap = [] } = configuration; 
    if (!columnMap.length) return;

    setConfiguration((f) => ({
      ...f,
      columnMap: f.columnMap.find(c => c.objectname === col.objectname && 
          c.name === col.name) 
        ? f.columnMap.filter (c => !(c.objectname === col.objectname && 
          c.name === col.name))
        : f.columnMap.concat(col)   
    }));
  }


  const sortOrderItem = (offset) => {
    const { columnMap } = configuration; 
    const clicked = columnMap.filter(f =>  f.clicked);
    clicked.map(node => {
      const ordinal = columnMap.indexOf(node);
      arraymove(columnMap, ordinal, ordinal + offset); 
    })
    setConfiguration((f) => ({
      ...f,
      columnMap 
    }));
  }

  const collateTables = (filter, passThru) => transformer.collateTables(configuration, filter, passThru); 


  const columnList = (filter, small, passThru) => {
    const p = [];
    const collated = collateTables(filter, passThru); 

    collated.map((column, i) => { 
      const error = collated.filter(n => n.alias === column.alias).length > 1;
      const { objectname, objectalias, name, alias, selected } = column;
      const last = i === (collated.length - 1)

      p.push(<>
        {objectalias}.<Tooltag component={AU}
          title={passThru ? "Add to column list" : "Remove from column list"}
          active={selected} 
          onClick={() => setColumnSelected(objectname, name)}>{name}</Tooltag>
          
          {!small && <> 
          {" "}<i>as</i>{" "}
          <AU active error={error} onClick={() => setColumnAlias(objectname, name)}>{alias}</AU>
          </>}{!last && <>, </>} {" "}
        </>)
    }) 

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
    predicates: transformer.predicates,
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

      <Tooltag title="Test Query" component={QueryTest} onResult={async(msg) => {
        await Alert(`Query completed ${msg.error?'with errors':'successfully'} in ${msg.since}ms.`);
        !!msg.error && Alert(`${msg.error.sqlMessage}`)
      }} sx={{mr: 2}} sql={createTSQL()} config={config} />

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

 {!showSQL && <SectionHeader expanded={showFieldNames} blank 
    buttons={[
      <Tooltag title="Set field order" component={RotateButton} sx={{mr: 2}} deg={orderMode ? 180 : 0}
        onClick={openColumnOrderPanel}>
        <UnfoldMore />
      </Tooltag>
    ]}
    actionText="Add fields" onAdd={() => setShowFieldNames(!showFieldNames)}>
   {orderMode ? "Set field order" : "SELECT"}
  </SectionHeader> }
    
  <Collapse in={!showSQL}>
    
    <Collapse in={!orderMode}>
      <Box sx={{m: theme => theme.spacing(1, 0)}}>
        {columnList(z => !!z.selected)}
          {configuration.fields?.map(f => <>{f.expression} as <AU active onClick={async () => {
            const b = await ExpressionModal(f)
            if (!b) return;  
            addExpression({...f, ...b})
          }}>{f.name}</AU></>)}
      </Box>
    </Collapse>
    

  <Collapse in={orderMode}>
        <Stack direction="row" sx={{alignItems: 'center'}}>
          <Card sx={{p: 2}}> 
            <Pane sx={{mb: 1}}>
              {configuration.columnMap?.map((item, i) => <Item 
                  key={i} 
                  active={item.clicked}
                  onClick={() => clickOrderItem(i)}
                >
                {item.objectalias}.{item.name} <i>as {item.alias}</i>
              </Item>)}
            </Pane>
            <FormControlLabel control={<Switch 
              checked={exclusive}
              onChange={e => setExclusive(e.target.checked)}
            />} label="Exclusive" />
          </Card>
          <Stack>
            <RotateButton deg={180} onClick={() => sortOrderItem(-1)} variant="outlined" sx={{m: .5}}><ExpandMore /></RotateButton>
            <RotateButton deg={0} onClick={() => sortOrderItem(1)} variant="outlined" sx={{m: .5}}><ExpandMore /></RotateButton>
          </Stack>
        </Stack> 
      </Collapse>

      <Collapse in={showFieldNames}>

        {!!columns.length && <>
          <Typography variant="caption">Available fields</Typography>
          <Box>
          {columnList(z => !z.selected, !0, !0)}
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
 
    <Card sx={{ p: 2, maxWidth: 400 }}>
      <Typography><b>SQL Code</b></Typography>
      <Divider />
      <pre>
        {createTSQL()}
      </pre>
    </Card>

  </Collapse>


  </QuerySettingsContext.Provider>
}
 
function SectionHeader({ children, inactive, blank, actionText, expanded, buttons = [], disabled, onAdd}) {

  const sx = inactive 
    ? {color: 'gray'}
    : {fontWeight: 600}
  return <>
  
  {!blank && <Divider sx={{m: theme => theme.spacing(1, 0)}}/>}

  <Stack direction="row" sx={{alignItems: 'center'}}>
    <Typography sx={sx}> {children} </Typography>
    <Box sx={{ flexGrow: 1 }}/>

    {buttons.map((button, i) => <Box key={i}>{button}</Box>)}
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
  const { tables, wheres, addClause, dropClause, predicates } = React.useContext(QuerySettingsContext);

 
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
    disableClearable
    autoComplete
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


export const QuickMenu = ({ label, error, value: selected, icons = [], options, onChange }) => {

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (value) => {  
    setAnchorEl(null);
    onChange && onChange(value)
  };
  // const arrow = open ? <>&#9650;</> : <>&#9660;</>
  return <>
  <AU style={{marginRight: 4}} active error={error} onClick={handleClick}>{label}</AU> 
 
  <Menu 
    anchorEl={anchorEl}
    open={open}
    onClose={() => handleClose()} 
  > 
    {options?.map ((option, index) => {
      const Icon = icons[index];
      return <MenuItem key={option} onClick={() => handleClose(option)}
      >{!!Icon && <><Icon sx={{mr: 1}} /></>}{selected === option && <>&bull;{" "}</>}{option}</MenuItem>
    })} 
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

export const QueryTest = ({ config, sql, onResult, ...props }) => {
  const [state, setState] = React.useState(0)
  const run = async () => {
    setState(1);
    const now = new Date().getTime()
    const f = await execQuery(config, sql); 
    const since = new Date().getTime() - now;

    onResult && onResult ({
      since,
      error: f?.error
    })

    setState(!f || f.error ? 2 : 3);

    setTimeout(() => {
      setState(0)
    }, 2999)
  }

  const hues = [
    'primary',
    'warning',
    'error',
    'success'
  ]

  const icons = [
    Speed,
    Sync,
    Error,
    CheckCircle
  ];

  const Icon = icons[state];

  return <IconButton color={hues[state]} {...props} onClick={run}>
    <Icon className={state === 1 ? 'spin' : ''} />
  </IconButton>
}