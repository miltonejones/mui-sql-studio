import * as React from 'react';
import './ListGrid.css';

import { 
   Box, Typography, Divider, 
  IconButton, 
  Stack,  Breadcrumbs, 
  Pagination, Link 
} from '@mui/material';
import { QuickMenu, Tooltag } from '..'; 
import { Sync, Menu } from '@mui/icons-material';
import { ListRow, SearchRow, Tiles } from './components'; 
   
   
export default function ListGrid({
  title, empty,  searchable, dense, wide,
  searches, sorts, onClear, onSearch, 
  commitRow, count = 0, page = 1, menuItems,
  setPage, buttons, onSort, dropOrder,
  breadcrumbs, onCellChange, columns = [], rows = []}) { 
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

  {!empty && <Tiles cellSpacing="1" wide={wide}>
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
    {rows.map((row, i) => <ListRow 
          index={i} 
          columns={columns}
          onCellChange={onCellChange} 
          dense={dense} 
          commitRow={commitRow} 
          key={row.field} 
          row={row} />)}
  </Tiles>}
   {/* <pre>
   {JSON.stringify(rows,0,2)}
   </pre> */}
  </>

}