import * as React from 'react';
import './ListGrid.css';

import { 
  styled, Box, Typography, Divider, 
  IconButton, InputAdornment,
  Stack, TextField, Breadcrumbs, 
  Pagination, Link, Checkbox
} from '@mui/material';
import { QuickMenu, Tooltag } from '..';
import { AppStateContext } from '../../hooks/AppStateContext';
import { Sync, Save, Close, Menu } from '@mui/icons-material';

const Cell = styled('td')(({theme, control, header, odd, dense, active}) => ({ 
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  padding: control ? 0 : theme.spacing(dense ? 0.5 : 1, 2),
  backgroundColor: header ? 'rgb(240, 240, 240)' : `rgb(${odd ? 250 : 255}, 255, 255)`, 
  color: !active ? 'black' : 'blue',
  cursor: !active ? 'default' : 'pointer',
  whiteSpace: 'nowrap', 
  '&:hover': {
    textDecoration: !active ? 'none' : 'underline',
  }
}));
  
const Tiles = styled('table')(({theme}) => ({ 
  backgroundColor: '#d9d9d9',
  minWidth: '80vw',
  // borderRadius: 5
}));
  
const CellText = styled(Typography)(({theme, clickable, active}) => ({ 
   cursor: clickable || active ? 'pointer' : 'default',
   color: active ? theme.palette.primary.main : '#222'
}));
  


function ListCell({ 
    field, 
    value, 
    alias,
    icon, 
    odd,
    action, 
    sortable, 
    sorted, 
    type,
    types, 
    control: Control,
    controlProps,
    edit, 
    dense,
    onSort,
    onChange ,
    sorts = [],
    dropOrder
  }) {
  const sortProp = sorts.find(s => s.fieldName === alias || s.fieldName?.indexOf(value) > -1 || s.field?.indexOf(value) > -1);
  const { Prompt } = React.useContext(AppStateContext);
  let text = value;
  if (typeof(value) === 'object') {
    try {
      text = JSON.stringify(value);
    } catch(e) {
      console.log (e)
    }
  }

  const ask = sortProp?.direction === 'ASC';

  const onClick = async () => {
    if (onSort) { 
      if (sortProp?.index) {
        return alert ('Hard-coded columns cannot be quick-sorted. Use the edit panel!')
      }
      return onSort(text, ask ? 'DESC' : 'ASC')
    }
    if (edit) {
       const ok = await Prompt(`Enter value for ${field}`, 'Set value', value );
       if (!ok) return; 
       onChange && onChange(ok)
       return
    }
    action && action ()
  }

  const cellText = type === 'password' ? '********' : text;

  // const deg = ask ? 180 : 0;
  const arrow = !ask ? <>&#9650;</> : <>&#9660;</>
  const c = (!!Control)
    ? <Control {...controlProps} />
    : ''

  const content = !types 
    ?  <Tooltag title={cellText} component={CellText} active={!!action || !!sortProp?.direction} clickable={type === 'header'} 
        variant={type === 'header' ? 'subtitle2' : 'body2'}>
      {cellText} {sortable && arrow}
    </Tooltag>
    : <QuickMenu options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>
 
  return <Cell control={!!Control} odd={odd} dense={dense} header={type === 'header'} active={edit || !!action}>
    <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}> 

     <Stack direction="row" spacing={1} sx={{alignItems: 'center'}} onClick={onClick}> 
     {c}
        {icon}
        {content} 
     </Stack>
      <Box sx={{flexGrow: 1}} />

      {sortProp?.direction && <Tooltag onClick={() => dropOrder(text)} 
        component={Box} title="Remove column sort" sx={{ cursor: 'pointer' }}>
        &times;
      </Tooltag>} 
    </Stack>
  </Cell>
}

function ListRow({ row, sortable, odd, onSort, dense, dropOrder, sorts = [], commitRow }) {
  const [data, setData] = React.useState(row)
  const [dirty, setDirty] = React.useState(false);
  
  return <tr> 
    {data.map((cell, i) => <ListCell odd={odd} dense={dense} dropOrder={dropOrder} 
      sorts={sorts} onSort={onSort} sortable={sortable} key={i} onChange={(datum) => { 
      setData((d) => d.map((r, k) => k === i ? {...r, value: datum} : r));
      setDirty(true)
    }} {...cell} />)}
    <Cell header dense={dense}>
      {dirty ? <><IconButton onClick={() => {
        commitRow && commitRow({data, row})
        setDirty(false);
        setData(row)
      }} xs={{mr: 1}} size="small">
        <Save />
        </IconButton>
        <IconButton size="small" onClick={() => {
        setDirty(false);
        setData(row)
      }}><Close /></IconButton></> : <>&nbsp;</>}
    </Cell>
  </tr>
}

function SearchRow({ row , searches = [], onChange, onClear}) {
  const params = {};
  searches.map(s => Object.assign(params, {[s.field]: s.value}))
  const [state, setState] = React.useState(params)
  return <tr>
    {row.map((cell, i) => {
      
      const adornment = !state[cell.value] ? {} : {
        endAdornment: <InputAdornment position="end">
          <IconButton size="small" onClick={() => {
            setState(s => ({...s, [cell.value]: ''}))
            onClear && onClear(cell.value, state[cell.value])
          }}>
            <Close />
          </IconButton>
        </InputAdornment>,
      }

  
      return (<Cell dense>
      <TextField fullWidth autoComplete="off" size="small" 
        value={state[cell.value]} onChange={(e) => setState(s => ({ ...s, [cell.value]: e.target.value }))} 
        sx={{minWidth: 100}} onKeyUp={e => e.keyCode === 13 && onChange && onChange(cell.value, state[cell.value])}
        placeholder={`"${cell.value}" Filter`} label="Search" InputProps={adornment}/>
    </Cell>)})}
    <Cell dense header>&nbsp;</Cell>
  </tr>
}

export default function ListGrid({
  title, empty,  searchable, dense,
  searches, sorts, onClear, onSearch, 
  commitRow, count = 0, page = 1, menuItems,
  setPage, buttons, onSort, dropOrder,
  breadcrumbs, rows = []}) { 
  if (!rows?.length && !empty) return <Stack direction="row" sx={{alignItems: 'center'}} spacing={1}><Sync className="spin" /> Loading...</Stack>
  const headers = empty ? [] : [rows[0].map(row => ({value: row.field, alias: row.alias, type: 'header'}))]
  const pageCount = Math.ceil(count / 100);

  const handleChange = (event, value) => {
    setPage && setPage(value);
  };

  const first = 1 + (100 * (page - 1));
  const desc = `${first} to ${Math.min(first + 99, count)} of ${count} records`

  return <>

  {!!breadcrumbs && <>
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {breadcrumbs.map(crumb => crumb.href 
        ? <Link href={crumb.href}><Typography variant="body2">{crumb.text}</Typography></Link> 
        : <Typography variant="body2">{crumb.text}</Typography>)}
    </Breadcrumbs>
  </>}

  {!!title && <>
    <Stack direction="row" sx={{alignItems: 'center'}}>
      {!!menuItems && <QuickMenu 
        options={menuItems.map(p => p.title)} 
        icons={menuItems.map(p => p.icon)} 
        label={<IconButton><Menu /></IconButton> } onChange={key => { 
          const { action } = menuItems.find(f => f.title === key); 
          action && action()
        }} />}
      <Typography variant="h6">{title}</Typography>
      <Box sx={{flexGrow: 1}} />
      {buttons?.map((button, i) => <Box key={i}>{button}</Box>)}
      {menuItems?.map(({title, icon: Icon, action}, i) => <Box key={i}>
        <Tooltag title={title} component={IconButton} onClick={action}>
          <Icon />
        </Tooltag>
      </Box>)}
    </Stack>
    <Divider sx={{mb: 1}} />
 
  </>}
 
    {!!count && <Stack direction="row" sx={{alignItems: 'center'}}>
      <Pagination sx={{mb: 1}}  onChange={handleChange} page={page} count={pageCount} />
      <Box sx={{flexGrow: 1}} />
      <Typography variant="caption">{desc}</Typography>
      </Stack>
      } 

  {empty && <Box sx={{cursor: 'pointer'}} onClick={() => onClear && onClear()}>Query returned no results. <u>Click here to clear filter</u>.</Box>}

  {!empty && <Tiles cellSpacing="1">
    {headers.map(row => <ListRow 
    dense={dense} 
    dropOrder={dropOrder} 
    sorts={sorts} 
    onSort={onSort} 
    sortable={searchable} 
    key={row.field} 
    row={row} 
    />)}
    {!!searchable && <SearchRow  searches={searches} 
      onClear={(key, val) => onClear && onClear(key, val)} 
      onChange={(key, val) => onSearch && onSearch(key, val)} 
    row={headers[0]} />}
    {rows.map((row, i) => <ListRow  odd={i % 2 === 0} dense={dense} commitRow={commitRow} key={row.field} row={row} />)}
  </Tiles>}
   {/* <pre>
   {JSON.stringify(rows,0,2)}
   </pre> */}
  </>

}