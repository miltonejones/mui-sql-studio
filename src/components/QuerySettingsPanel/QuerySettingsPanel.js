import * as React from 'react';
import { describeTable, connectToDb, execQuery, execCommand } from '../../connector/dbConnector';
import { AppStateContext } from '../../hooks/AppStateContext';
import { useQueryTransform } from '../../hooks/useQueryTransform';
import { Divider, Box, Breadcrumbs,  Autocomplete, Card,
  Link, FormControlLabel, Switch, Menu, Collapse, MenuItem, 
  TextField, Stack,  ToggleButtonGroup, ToggleButton, 
  IconButton, Typography, styled } from '@mui/material';
import { Add, UnfoldMore, Speed, Remove,  Sync, CheckCircle,
  Error, Delete, ExpandMore, PlayArrow, Close, Menu as MenuIcon} from '@mui/icons-material';

import { ColumnSettingsGrid } from './components'
import { Tooltag, RotateButton, TextBtn, Flex, TinyButton  } from '..'
import '../ListGrid/ListGrid.css';
import { QueryColumn } from './components';



const QuerySettingsContext = React.createContext({});
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

 


const AU = styled('u')(({ theme, active, error }) => ({
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
  fontStyle: 'italic',
  color: error ? theme.palette.error.main : theme.palette.primary.main, 
  '&:hover': {
    textDecoration: 'underlined',
    color: theme.palette.primary.dark
  }
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
  const { Alert, Prompt, Confirm, ExpressionModal, setBreadcrumbs } = React.useContext(AppStateContext);

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
    const columns = rows.map((col, i) => ({
      name: col.COLUMN_NAME,
      alias: col.COLUMN_NAME , 
      ...col
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
      assignColumnAlias(name, field, alias);
    });
  };

  const assignColumnAlias = (name, field, aliasName) => {
    const alias = aliasName.indexOf(' ') > -1
      ? `'${aliasName}'`
      : aliasName
    editColumn(name, field, async (col, table) => { 
      Object.assign(col, { alias });
      clearConfig(columnMap => {
        setConfiguration((f) => ({
          ...f,
          columnMap: columnMap?.map(
            c => c.name === col.name && c.objectname === table.name 
              ? ({...c, alias})
              : c
          )
        }));
      })
    });
  }

  const assignColumnType = (name, field, type) => {
    editColumn(name, field, async (col, table) => { 
      Object.assign(col, { type });
      clearConfig(columnMap => {
        setConfiguration((f) => ({
          ...f,
          columnMap: columnMap?.map(
            c => c.name === col.name && c.objectname === table.name 
              ? ({...c, type})
              : c
          )
        }));
      })
    });
  }

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


  function arraymove(arr, fromIndex, toIndex) {
    if (toIndex > -1) {
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

  const clearConfig = (fn) => {
    const { columnMap } = configuration; 
    setConfiguration((f) => ({
      ...f,
      columnMap : []
    }));
    setTimeout(() => fn(columnMap), 9)
  }

  const clickOrderItem = o => {
    clearConfig((columnMap) => {
      setConfiguration((f) => ({
        ...f,
        columnMap: columnMap.map((c, i) => i === o ? {...c, clicked: !c.clicked} : {...c, clicked: exclusive ? !1 : c.clicked})
      }));
    }) 
  }


  const sortOrderItem = (offset) => {
    clearConfig((columnMap) => {
      const clicked = columnMap.filter(f =>  f.clicked);
      clicked.map(node => {
        const ordinal = columnMap.indexOf(node);
        return arraymove(columnMap, ordinal, ordinal + offset); 
      })
      setConfiguration((f) => ({
        ...f,
        columnMap 
      }));
    }) 
  }

  const collateTables = (filter, passThru) => transformer.collateTables(configuration, filter, passThru); 

  const configureExpr = async (f) => {
    const b = await ExpressionModal(f)
    if (!b) return;  
    if (b === -1) {
      return dropExpression(f.index);
    }
    addExpression({...f, ...b})
  }

  const columnList = (filter, small, passThru) => {
    const p = [];
    const collated = collateTables(filter, passThru); 

    collated.map((column, i) => { 
      const error = !small && collated.filter(n => !!n.alias && n.alias === column.alias).length > 1;
      const { objectname, objectalias, name, alias, selected, expression } = column;
      const last = i === (collated.length - 1);

      const args = {
        error,
        expression,
        objectalias,
        columnname: name,
        columnalias: alias,
        small,
        title: !!expression 
        ? <em>{expression}</em>
        : <>{objectalias}.{name}</>,
        icon: passThru ? Add : Delete ,
        aliasAction: !!expression 
        ? () => configureExpr(column)
        : () => setColumnAlias(objectname, name),
        deleteAction: () => setColumnSelected(objectname, name)
      };

      return p.push (<QueryColumn {...args} />) 
    }) 

    return p.length ? p : ['*'];
  }
  
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
    const { columnMap: oldMap = [] } = configuration; 
    let columnMap;
    if (field.index) {
      columnMap = !oldMap.find (f => f.index === field.index)
        ? oldMap.concat(field)
        : oldMap.map(f => f.index === field.index ? field : f); 
      return setConfiguration((f) => ({
        ...f,
        columnMap,
        fields: (f.fields||[]).map((t) => (t.index === field.index ? field : t)),
      }));
    }
    const name = field.name.indexOf(' ') > -1
      ? `'${field.name}'`
      : field.name
    const column = {...field, name, index: uniqueId()};
    columnMap = oldMap.concat(column);
    setConfiguration((f) => ({
      ...f,
      columnMap,
      fields: (f.fields||[]).concat(column)
    }));
  }

  const dropExpression = async (ID) => {
    if (!ID) return Alert ('No ID was present!')
    const ok = await Confirm(`Remove expression?`);
    if (!ok) return;
    setConfiguration((f) => ({
      ...f,
      columnMap: f.columnMap?.filter(c => c.index !== ID),
      fields: f.fields?.filter(c => c.index !== ID)
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
  

  if (!tablename) {
    return <>No table was entered.</>
  }
 
  const menuItems = [
    {
      title: 'Run Query',
      icon: PlayArrow, 
      action: () => onCommit && onCommit(createTSQL())
    },
    {
      title: 'Close',
      icon: Close, 
      action: () => onCancel && onCancel()
    },
  ]
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
  {/* {!!breadcrumbs && <>
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {breadcrumbs.map(crumb => crumb.href 
        ? <Link href={crumb.href}><Typography variant="body2">{crumb.text}</Typography></Link> 
        : <Typography variant="body2">{crumb.text}</Typography>)}
    </Breadcrumbs>
  </>} */}
  <Stack direction="row" sx={{alignItems: 'center'}}>
  {!!menuItems && <QuickMenu 
        options={menuItems.map(p => p.title)} 
        icons={menuItems.map(p => p.icon)} 
        label={<IconButton><MenuIcon /></IconButton> } onChange={key => { 
          const { action } = menuItems.find(f => f.title === key); 
          action && action()
        }} />}
        
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
      <Tooltag title={orderMode ? "Close field settings" : "Set field order"} component={RotateButton} sx={{mr: 2}} deg={orderMode ? 0 : 180}
        onClick={openColumnOrderPanel}>
        {orderMode ? <Close /> : <UnfoldMore />}
      </Tooltag>
    ]}
    actionText="Add fields" onAdd={() => setShowFieldNames(!showFieldNames)}>
   {orderMode ? "Order fields" : "SELECT"}
  </SectionHeader> }
    
  <Collapse in={!showSQL}>
    
    <Collapse in={!orderMode}>
      <Flex wrap sx={{m: theme => theme.spacing(1, 0)}}>
        {columnList(z => !!z.selected)} 
      </Flex>
    </Collapse>
    

    <Collapse in={orderMode}>
        <Stack direction="row" sx={{alignItems: 'center'}}>
          <Box sx={{p: 0}}>  
            <ColumnSettingsGrid onChange={(key, val, index) => {
            
              const { objectname, name } = configuration.columnMap[index];
              switch (key) {
                case "Label": 
                  assignColumnAlias(objectname, name, val) 
                  break;
                case "Type":
                  assignColumnType(objectname, name, val) 
                  break;
                default:
                  // do nothing
              }
              // alert (JSON.stringify({key, val}))
            }} onSelect={clickOrderItem} 
            onConfig={configureExpr}
            columns={configuration.columnMap} />

          </Box>
          <Stack>
            <RotateButton deg={180} onClick={() => sortOrderItem(-1)} variant="outlined" sx={{m: .5}}><ExpandMore /></RotateButton>
            <RotateButton deg={0} onClick={() => sortOrderItem(1)} variant="outlined" sx={{m: .5}}><ExpandMore /></RotateButton>
          </Stack>
        </Stack> 
        <FormControlLabel control={<Switch 
          checked={exclusive}
          onChange={e => setExclusive(e.target.checked)}
        />} label="Exclusive" />

      </Collapse>

      <Collapse in={showFieldNames}>

        {!!columns.length && <>
          <Typography variant="caption">Available fields</Typography>
          <Flex wrap>
          {columnList(z => !z.selected, !0, !0)}
          </Flex>
        </>}

        <TextBtn endIcon={<Add />} size="small" variant="contained"  
          onClick={async () => {
            const b = await ExpressionModal({})
            if (!b) return; 
            addExpression(b)
          }}
          sx={{mr: 1, mt: 1}}
          >add expression</TextBtn>
      
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

            <Flex wrap>
              {tableNames.filter(t => !configuration.tables.find(c => c.name === t)).map(tname => <>
                <QueryColumn title={tname} icon={Add} aliasAction={() => addTable(tname)}
                 deleteAction={() => addTable(tname)}/> 
                {/* <AU onClick={() => addTable(tname)}>{tname}</AU>, {" "} */}
              </>)}
            </Flex>
          </>
        </Collapse>


      </Stack>
      

      <SectionHeader disabled={configuration.wheres.length}  inactive={!configuration.wheres.length}
        actionText="Add where clause" onAdd={() => newClause({index: uniqueId()})}>
        WHERE
      </SectionHeader> 

      {configuration.wheres.map((where) => <WhereItem key={where.index} {...where} />)}

      {!!configuration.wheres.length && <>
        <TextBtn endIcon={<Add />} size="small" variant="contained" onClick={() => newClause({operator: 'AND', index: uniqueId()})} sx={{mr: 1}}>AND</TextBtn>
        <TextBtn endIcon={<Add />} size="small" variant="contained" onClick={() => newClause({operator: 'OR', index: uniqueId()})}>OR</TextBtn>
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

        <TextBtn size="small" sx={{mr: 1}} endIcon={ <Close />} onClick={() => onCancel && onCancel()}
          variant="outlined">
        close
        </TextBtn>
      {!!onCommit && <TextBtn color="warning" onClick={() => onCommit(createTSQL())} variant="contained"
        size="small" endIcon={<PlayArrow />}
      >run</TextBtn>}

    </Stack>

  </Collapse>
  

  <Collapse in={showSQL}>
 
    <Card sx={{ p: 2, mt: 2, maxWidth: 640 }}>
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
  const {  groups, orders, addGroupBy, dropGroupBy } = React.useContext(QuerySettingsContext);


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
  onChange ,
  small,
  ...props
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
    sx={{mr: 1, minWidth: small ? 120 : 220}}
    size="small"
    value={selected} 
    options={selections}
    onChange={handleChange} 
    {...props}
    renderInput={(params) => <TextField {...params} label={label} placeholder="Filter options" size="small" />}
 />
  </>

}


export const QuickMenu = ({ 
    label, 
    error, 
    title,
    value: selected, 
    caret, icons = [], 
    options, 
    onChange 
  }) => {

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (value) => {  
    setAnchorEl(null);
    onChange && onChange(value)
  }; 
  const { MenuComponent, menuPos } = React.useContext(AppStateContext);

  return <>


<AU style={{marginRight: 4}} 
    active={open} error={error || open} onClick={handleClick}>{label || 'Choose'}</AU> 
  {!!caret && <TinyButton onClick={handleClick} icon={ExpandMore} deg={open ? 180 : 0} />}
 
  <MenuComponent  
    anchorEl={anchorEl}
    anchor={menuPos}
    open={open}
    onClose={() => handleClose()} 
  > 
  {!!title && <Flex sx={{m: t => t.spacing(1,0)}}><Divider sx={{width: '100%'}}><Typography variant="caption">{title}</Typography></Divider></Flex>}

    {options?.map ((option, index) => {
      const Icon = icons[index];
      return <MenuItem key={option} onClick={() => handleClose(option)}
      sx={{fontWeight: selected === option ? 600 : 400, minWidth: 300}}
      >{!!Icon && <><Icon sx={{mr: 1}} /></>}{selected === option && <>&bull;{" "}</>}{option}</MenuItem>
    })} 
  </MenuComponent>
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
    return <QueryColumn columnname={table.name} columnalias={table.alias} title={table.name} 
    aliasAction={() => setTableAlias(table.name)}
    deleteAction={() => addTable(table.name)}/> 
  }
  return <Box sx={{mt: 1}} > 

  {" "}<QuickMenu caret title="Join type" options={['JOIN', 'LEFT JOIN']} 
      onChange={handleType} value={type} label={type}/>
  {" "}
  <QueryColumn columnname={table.name} columnalias={table.alias} title={table.name} 
    aliasAction={() => setTableAlias(table.name)}
    deleteAction={() => dropTable(table.ID)}/>
 
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
  return <QuickMenu caret title={`Columns in ${selectedTable.name}`} options={columns.map(n => n.name)} label={label} value={columnname} onChange={handleClose}  />  
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


  const label = name || <i>choose table</i> ;

  return <QuickMenu caret title="Available tables" options={tables.map(n => n.name)} label={label} value={name} onChange={handleClose}  />   
}

export const QueryTest = ({ config, sql, onResult, noneQuery, ...props }) => {
  const [state, setState] = React.useState(0)
  const run = async () => {
    const command = noneQuery ? execCommand : execQuery;
    setState(1);
    const now = new Date().getTime()
    const f = await command(config, sql); 
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