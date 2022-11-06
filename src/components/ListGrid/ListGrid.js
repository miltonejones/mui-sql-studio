import * as React from 'react';

import { styled, Box, Typography, Divider, Stack, Breadcrumbs, Pagination, Link} from '@mui/material';


const Cell = styled('td')(({theme, active}) => ({ 
  padding: theme.spacing(1, 2),
  backgroundColor: 'white',
  color: !active ? 'black' : 'blue',
  textDecoration: !active ? 'none' : 'underline',
  cursor: !active ? 'default' : 'pointer',
  whiteSpace: 'nowrap'
}))
  
const Tiles = styled('table')(({theme}) => ({ 
  backgroundColor: 'gray',
  minWidth: '80vw'
}))
  


function ListCell({ value, type, icon, action }) {
  let text = value;
  if (typeof(value) === 'object') {
    try {
      text = JSON.stringify(value);
    } catch(e) {
      console.log (e)
    }
  }
  // const text = typeof(value) === 'object' && !!value
  //   ? JSON.stringify(value)
  //   : value
  return <Cell active={!!action}>
    <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}> 
      {icon}
      <Typography onClick={() => action && action ()} variant={type === 'header' ? 'caption' : 'body2'}>
      {type === 'password' ? '********' : text}
      </Typography>
    </Stack>
  </Cell>
}

function ListRow({ row }) {
  return <tr>
    {row.map((cell, i) => <ListCell key={i} {...cell} />)}
    <Cell>&nbsp;</Cell>
  </tr>
}


export default function ListGrid({title, count = 0, page = 1, setPage, buttons, breadcrumbs, rows = []}) {
  if (!rows?.length) return <>Loading...</>
  const headers = [rows[0].map(row => ({value: row.field, type: 'header'}))]
  const pageCount = Math.ceil(count / 100);

  const handleChange = (event, value) => {
    setPage && setPage(value);
  };

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
 
    {!!count && <Pagination sx={{mb: 1}}  onChange={handleChange} page={page} count={pageCount} />}
  </>}

  
  <Tiles cellSpacing="1">
    {headers.map(row => <ListRow key={row.field} row={row} />)}
    {rows.map(row => <ListRow key={row.field} row={row} />)}
  </Tiles>
  
  {/* <pre>{JSON.stringify(rows,0,2)}</pre> */}
 
  </>

}