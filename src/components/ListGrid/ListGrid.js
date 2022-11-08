import * as React from 'react';
import './ListGrid.css';

import { styled, Box, Typography, Divider, 
  IconButton, InputAdornment,
  Stack, TextField, Breadcrumbs, Pagination, Link} from '@mui/material';
import { QuickMenu } from '..';
import { AppStateContext } from '../../hooks/AppStateContext';
import { Sync, Save, Close } from '@mui/icons-material';

const Cell = styled('td')(({theme, header, active}) => ({ 
  padding: theme.spacing(1, 2),
  backgroundColor: header ? 'rgb(240, 240, 240)' : 'white', 
  color: !active ? 'black' : 'blue',
  textDecoration: !active ? 'none' : 'underline',
  cursor: !active ? 'default' : 'pointer',
  whiteSpace: 'nowrap',
  // borderRadius: 5
}))
  
const Tiles = styled('table')(({theme}) => ({ 
  backgroundColor: '#d9d9d9',
  minWidth: '80vw',
  // borderRadius: 5
}))
  


function ListCell({ field, value, type, icon, action, types, edit, onChange }) {
  const { Prompt } = React.useContext(AppStateContext);
  let text = value;
  if (typeof(value) === 'object') {
    try {
      text = JSON.stringify(value);
    } catch(e) {
      console.log (e)
    }
  }

  const onClick = async () => {
    if (edit) {
       const ok = await Prompt(`Enter value for ${field}`, 'Set value', value );
       if (!ok) return; 
       onChange && onChange(ok)
       return
    }
    action && action ()
  }

  const content = !types 
    ?  <Typography variant={type === 'header' ? 'subtitle2' : 'body2'}>
      {type === 'password' ? '********' : text}
    </Typography>
    : <QuickMenu options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>
 
  return <Cell header={type === 'header'} active={edit || !!action}>
    <Stack onClick={onClick} direction="row" spacing={1} sx={{alignItems: 'center'}}> 
      {icon}
      {content}
    </Stack>
  </Cell>
}

function ListRow({ row, commitRow }) {
  const [data, setData] = React.useState(row)
  const [dirty, setDirty] = React.useState(false);
  
  return <tr>
    {data.map((cell, i) => <ListCell key={i} onChange={(datum) => { 
      setData((d) => d.map((r, k) => k === i ? {...r, value: datum} : r));
      setDirty(true)
    }} {...cell} />)}
    <Cell header>
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
          <IconButton onClick={() => {
            setState(s => ({...s, [cell.value]: ''}))
            onClear && onClear(cell.value, state[cell.value])
          }}>
            <Close />
          </IconButton>
        </InputAdornment>,
      }

  
      return (<Cell>
      <TextField fullWidth autoComplete="off" size="small" value={state[cell.value]} onChange={(e) => setState(s => ({ ...s, [cell.value]: e.target.value }))} 
        sx={{minWidth: 100}} onKeyUp={e => e.keyCode === 13 && onChange && onChange(cell.value, state[cell.value])}
        placeholder={cell.value} label="Search" InputProps={adornment}/>
    </Cell>)})}
    <Cell header>&nbsp;</Cell>
  </tr>
}

export default function ListGrid({title, empty, searchable, searches, onClear, onSearch, commitRow, count = 0, page = 1, setPage, buttons, breadcrumbs, rows = []}) {
  // if (empty) return <Box onClick={() => onClear && onClear()}>Query returned no results. Click here to clear filter.</Box>
  if (!rows?.length && !empty) return <Stack direction="row" sx={{alignItems: 'center'}} spacing={1}><Sync className="spin" /> Loading...</Stack>
  const headers = empty ? [] : [rows[0].map(row => ({value: row.field, type: 'header'}))]
  const pageCount = Math.ceil(count / 100);

  const handleChange = (event, value) => {
    setPage && setPage(value);
  };

  const first = 1 + (100 * (page - 1));
  const desc = `${first} to ${Math.min(first + 99, count)} of ${count} records`

  return <>

  {!!breadcrumbs && <>
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {breadcrumbs.map(crumb => crumb.href ? <Link href={crumb.href}>{crumb.text}</Link> : <Typography>{crumb.text}</Typography>)}
    </Breadcrumbs>
  </>}

  {!!title && <>
    <Stack direction="row" sx={{alignItems: 'center'}}>
      <Typography variant="h6">{title}</Typography>
      <Box sx={{flexGrow: 1}} />
      {buttons?.map((button, i) => <Box key={i}>{button}</Box>)}
    </Stack>
    <Divider sx={{mb: 1}} />
 
    {!!count && <Stack direction="row" sx={{alignItems: 'center'}}>
      <Pagination sx={{mb: 1}}  onChange={handleChange} page={page} count={pageCount} />
      <Box sx={{flexGrow: 1}} />
      <Typography variant="caption">{desc}</Typography>
      </Stack>
      } 
  </>}
 
  {empty && <Box sx={{cursor: 'pointer'}} onClick={() => onClear && onClear()}>Query returned no results. <u>Click here to clear filter</u>.</Box>}

  {!empty && <Tiles cellSpacing="1">
    {headers.map(row => <ListRow key={row.field} row={row} />)}
    {!!searchable && <SearchRow searches={searches} 
      onClear={(key, val) => onClear && onClear(key, val)} 
      onChange={(key, val) => onSearch && onSearch(key, val)} 
    row={headers[0]} />}
    {rows.map(row => <ListRow commitRow={commitRow} key={row.field} row={row} />)}
  </Tiles>}
  
  {/* <pre>{JSON.stringify(rows,0,2)}</pre> */}
 
  </>

}