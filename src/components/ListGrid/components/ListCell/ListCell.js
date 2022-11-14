import React from 'react';
import { styled, Box, Stack, Typography } from '@mui/material';
import { Cell } from '..';
import { QuickMenu, Tooltag } from '../../..';
import { AppStateContext } from '../../../../hooks/AppStateContext';
import { PlayCircle, Image, StopCircle  } from "@mui/icons-material";
   
const CellText = styled(Typography)(({theme, clickable, selected, active}) => ({ 
  cursor: clickable || active ? 'pointer' : 'default',
  color: active ? theme.palette.primary.main : '#222',
  fontWeight: selected ? 600 : 400
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
const { Prompt, audioProp, setAudioProp } = React.useContext(AppStateContext);
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
  if (column?.type === 'image') {
    return window.open(value)
  }
  if (column?.type === 'audio') {
    setAudioProp(null);
    if (value === audioProp) return;
    return setTimeout(() => {
      setAudioProp(value)
    }, 9)
  }
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
// https://s3.amazonaws.com/box.import/
const cellText = type === 'password' ? '********' : text;

// const deg = ask ? 180 : 0;
const arrow = !ask ? <>&#9650;</> : <>&#9660;</>
const c = (!!Control)
  ? <Control {...controlProps} />
  : ''

const cellSelected = selected || (audioProp && (value === audioProp));
const audioIcon = value === audioProp ? <StopCircle /> : <PlayCircle />
const mediaIcon = column?.type === 'image' ? <Image /> : audioIcon;
const cellIcon = column?.type === 'audio' || column?.type === 'image' ? mediaIcon : icon;
const imageContent = <img alt={cellText} src={cellText} style={{width: 160, height: 'auto'}}  />

const content = !types 
  ?  <Tooltag title={column?.type === 'image' ? imageContent : cellText} 
      selected={cellSelected}
      component={CellText} active={!!action || !!sortProp?.direction} 
      clickable={type === 'header'} 
      variant={type === 'header' ? 'subtitle2' : 'body2'}>
    {cellText} {sortable && arrow}
  </Tooltag>
  : <QuickMenu options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>

return <Cell selected={cellSelected} control={!!Control} odd={odd} dense={dense} 
  header={type === 'header'} active={edit || !!action}>
  <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}> 

   <Stack direction="row" spacing={1} sx={{alignItems: 'center'}} onClick={onClick}>  
      {c} 
      {cellIcon}
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
