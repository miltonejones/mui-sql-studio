import React from 'react';
import { IconButton } from '@mui/material';
import { Cell, ListCell } from '..'
import { Save, Close } from '@mui/icons-material';
 




function ListRow({ row, sortable, odd, onSort, columns = [], index, dense, dropOrder, onCellChange, sorts = [], commitRow }) {
  const [data, setData] = React.useState(row)
  const [dirty, setDirty] = React.useState(false);
  
  return <tr> 
    {data.map((cell, i) => <ListCell odd={odd} dense={dense} dropOrder={dropOrder} 
      sorts={sorts} onSort={onSort} sortable={sortable} key={i} onChange={(datum) => { 
      if (onCellChange) {
        return onCellChange(cell.field, datum, index);
      }
      setData((d) => d.map((r, k) => k === i ? {...r, value: datum} : r));
      setDirty(true)
    }} 
    {...cell} 
    column={columns[i]}/>)}
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

ListRow.defaultProps = {};
export default ListRow;
