import React from 'react';
import { styled, Box, Stack, TextField, Typography, Popover } from '@mui/material';
import { Cell, EditCell } from '..';
import { QuickMenu, Tooltag, Flex, TinyButton } from '../../..';
import { AppStateContext } from '../../../../hooks/AppStateContext';
import { PlayCircle, Image, StopCircle, ExpandMore, Close, Save  } from "@mui/icons-material"; 
import { Spacer } from '../../..';
   
const CellText = styled(Typography)(({theme, clickable, selected, active}) => ({ 
  maxWidth: 180,
  overflow: 'hidden',
  whiteSpace: 'nowrap', 
  textOverflow: 'ellipsis',
  cursor: clickable || active ? 'pointer' : 'default',
  color: active ? theme.palette.primary.main : '#222',
  fontWeight: selected ? 600 : 400
}));
 

function PopoverText ({ field, value, onChange, handleClose }) {
  const [typedVal, setTypedVal] = React.useState(value);

  return <Stack sx={{p: 2, width: 280}} spacing={1}>
  <Typography>Set value for "{field}"</Typography>
  <TextField label={field + ' value'} size="small" value={typedVal} onChange={ (e) => { 
    setTypedVal(e.target.value) 
  } } autoComplete="off"/>
  <Flex> 
    <Spacer />
    <TinyButton icon={Close} onClick={handleClose} />
    <TinyButton icon={Save} onClick={() => {  
        !!typedVal && onChange && onChange(typedVal);
        handleClose()
    }}/>
  </Flex>
</Stack>
}


function ListCell(props) {
const { 
  field, 
  value, 
  alias,
  popover,
  create,
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
} = props;
const sortProp = sorts.find(s => s.fieldName === alias || s.fieldName?.indexOf(value) > -1 || s.field?.indexOf(value) > -1);
const { Prompt, audioProp, setAudioProp } = React.useContext(AppStateContext);
const [popoverContent, setPopoverContent] = React.useState(popover);
const [typedVal, setTypedVal] = React.useState(null);
const [anchorEl, setAnchorEl] = React.useState(null);

const handleClick = (event) => {
  setAnchorEl(event.currentTarget);
};

const handleClose = () => {
  setAnchorEl(null);
  setPopoverContent(popover);
};

const open = Boolean(anchorEl);


if (create) {
  return <EditCell {...props} />
}

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

const onClick = async (event) => {
  if (edit) { 
    setPopoverContent(<PopoverText {...props} onChange={onChange} handleClose={handleClose} />) 
    setAnchorEl(event.currentTarget);
    return
  }
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
const imageContent = <img alt={cellText} src={cellText} style={{width: 160, height: 'auto'}}  />;

const content = !types 
  ?  <Tooltag title={column?.type === 'image' ? imageContent : cellText} 
      selected={cellSelected}
      component={CellText} active={!!action || !!sortProp?.direction} 
      clickable={type === 'header'} 
      variant={type === 'header' ? 'subtitle2' : 'body2'}>
    {cellText} {sortable && arrow}
  </Tooltag>
  : <QuickMenu options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>

return <><Cell selected={cellSelected} control={!!Control} odd={odd} dense={dense} 
  header={type === 'header'} active={edit || !!action}>
  <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}> 

   <Stack direction="row" spacing={1} sx={{alignItems: 'center', width: '100%'}}>
      <Flex onClick={onClick}>
        {c} 
        {cellIcon}
        {content} 
      </Flex>  
      <Box sx={{flexGrow: 1}} />
      {!!popover && <TinyButton icon={ExpandMore} deg={!open?0:180}  onClick={handleClick}/>}
   </Stack>

    <Box sx={{flexGrow: 1}} />

    {sortProp?.direction && <Tooltag onClick={() => dropOrder(text)} 
      component={Box} title="Remove column sort" sx={{ cursor: 'pointer' }}>
      &times;
    </Tooltag>} 
  </Stack>
</Cell>

  {!!popoverContent && <Popover 
    open={open}
    anchorEl={anchorEl}
    onClose={handleClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
  >
    {popoverContent}
  </Popover>}


</>
}

ListCell.defaultProps = {};
export default ListCell;
