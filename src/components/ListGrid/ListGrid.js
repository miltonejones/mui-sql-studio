import * as React from 'react';
import './ListGrid.css';

import { 
  Alert, Box, Typography, Divider, 
  IconButton, 
  Stack, 
  Pagination 
} from '@mui/material';
import { QuickMenu, Tooltag, RotateButton } from '..'; 
import { DonutLarge, Menu } from '@mui/icons-material';
import { ListRow, SearchRow, Tiles } from './components'; 
   
   
export default function ListGrid({
  title, empty,  searchable, dense, wide, create,
  searches, sorts, onClear, onSearch, pageSize = 20,
  commitRow, count = 0, page = 1, menuItems,  allowDelete, onDelete, 
  setPage, buttons, onSort, dropOrder, setPageSize, settings,
  breadcrumbs, onCellChange, columns = [], rows = []}) { 
  if (!rows?.length && !empty) return <Stack direction="row" sx={{alignItems: 'center'}} spacing={1}
    ><DonutLarge className="spin" /> <Box>Loading...</Box></Stack>
  const headers = empty ? [] : [rows[0].map(row => ({value: row.field, alias: row.alias, type: 'header'}))]
  const pageCount = Math.ceil(count / pageSize);

  const handleChange = (event, value) => {
    setPage && setPage(value);
  };

  const first = 1 + (pageSize * (page - 1));
  const desc = `${first} to ${Math.min(first + pageSize - 1, count)} of ${count} records`

  return <>
 

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
      {menuItems?.filter(f => !f.hide).map(({title, icon: Icon, action, deg = 0}, i) => <Box key={i}>
        <Tooltag title={title} component={RotateButton} deg={deg} onClick={action}>
          <Icon />
        </Tooltag>
      </Box>)}
    </Stack>
    <Divider sx={{mb: 1}} />
 
  </>}
 
    {!!count && <Stack direction="row" sx={{alignItems: 'center'}}>
      {count > pageSize && <Pagination sx={{mb: 1}}  onChange={handleChange} page={page} count={pageCount} />}
      <Box sx={{flexGrow: 1}} />
      <Typography sx={{mr: 1}} variant="caption">{desc}</Typography>
      <Typography sx={{mr: 1}} variant="caption">Rows per page</Typography>
      <QuickMenu title="Rows per page" options={[20,50,100,250]} label={pageSize} value={pageSize} onChange={e => {
        !!e && setPageSize(e)
      }} />
      </Stack>
      } 

  {empty && <Alert severity="warning"><Box sx={{cursor: 'pointer'}} onClick={() => onClear && onClear()}
      >Query returned no results. <u>Click here to clear filter</u>.</Box></Alert>}

  {!empty && <Tiles cellSpacing="1" wide={wide}>
    <thead>
        {headers.map((row, i) => <ListRow 
      header={settings}
      setSettings={window.alert}
      dense={dense} 
      dropOrder={dropOrder} 
      sorts={sorts} 
      onSort={onSort} 
      sortable={searchable} 
      key={i} 
      row={row} 
      />)}  
    </thead>

    <tbody>

      {!!searchable && <SearchRow  searches={searches} 
        onClear={(key, val) => onClear && onClear(key, val)} 
        onChange={(key, val) => onSearch && onSearch(key, val)} 
      row={headers[0]} />}
      {rows.map((row, i) => <ListRow 
            index={i} 
            allowDelete={allowDelete}  
            onDelete={onDelete}
            columns={columns}
            onCellChange={onCellChange} 
            dense={dense} 
            commitRow={commitRow} 
            key={i} 
            row={row} />)}

      {!!create && <ListRow 
        create 
        columns={columns}
        onCellChange={onCellChange} 
        dense={dense} 
        commitRow={commitRow}  
        row={rows[0]} 

      />}

    </tbody>

  </Tiles>}

  </>

}