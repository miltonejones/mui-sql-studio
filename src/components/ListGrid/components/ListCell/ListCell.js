import React from 'react';
import { styled, Box, Stack, Typography } from '@mui/material';
import { Cell } from '..';
import { QuickMenu, Tooltag } from '../../..';
import { AppStateContext } from '../../../../hooks/AppStateContext';
  
const Layout = styled(Box)(({ theme }) => ({
 margin: theme.spacing(4)
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
  column,
  selected,
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

if (!(!!text || !!text?.length) && !Control && type !== 'header') {
  text = '[empty]'
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

const imageContent = <img alt={cellText} src={cellText} style={{width: 160, height: 'auto'}}  />

const content = !types 
  ?  <Tooltag title={column?.type === 'image' ? imageContent : cellText} component={CellText} active={!!action || !!sortProp?.direction} clickable={type === 'header'} 
      variant={type === 'header' ? 'subtitle2' : 'body2'}>
    {cellText} {sortable && arrow}
  </Tooltag>
  : <QuickMenu options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>

return <Cell selected={selected} control={!!Control} odd={odd} dense={dense} 
  header={type === 'header'} active={edit || !!action}>
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

ListCell.defaultProps = {};
export default ListCell;
