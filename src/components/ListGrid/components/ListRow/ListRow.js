import React from 'react'; 
import { Cell, ListCell } from '..';
import { TinyButton } from '../../..';
import { Save, Close, Delete, Settings } from '@mui/icons-material';
  


function ListRow({  
  allowDelete, 
  onDelete, 
  row, 
  sortable, 
  create, 
  odd, 
  onSort, 
  columns = [], 
  index, 
  header,
  dense, 
  dropOrder, 
  onCellChange, 
  sorts = [], 
  commitRow ,
  setSettings
}) {
  const [data, setData] = React.useState(row)
  const [dirty, setDirty] = React.useState(false);
  
  return <tr> 
    {data.map((cell, i) => <ListCell create={create} odd={odd} dense={dense} dropOrder={dropOrder} 
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
      {header && <TinyButton sx={{ mr: 1 }} icon={Settings} onClick={setSettings} />}
      {allowDelete && <TinyButton sx={{ mr: 1 }} icon={Delete} onClick={() => onDelete(row)}/>}
      {dirty ? <><TinyButton sx={{ mr: 1 }} icon={Save} onClick={() => {
        commitRow && commitRow({data, row, create})
        setDirty(false);
        setData(row)
      }} xs={{mr: 1}} size="small"/>
        <TinyButton icon={Close} size="small" onClick={() => {
        setDirty(false);
        setData(row)
      }}/></> : <>&nbsp;</>}
    </Cell>
  </tr>
}

ListRow.defaultProps = {};
export default ListRow;
