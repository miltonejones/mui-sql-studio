import React from 'react';
import { styled, Box, Stack, TextField, Typography } from '@mui/material';
import { Cell, EditCell } from '..';
import { QuickMenu, Tooltag, Flex, TinyButton, PopoverTextBox } from '../../..';
import { AppStateContext } from '../../../../hooks/AppStateContext';
import { PlayCircle, MoreVert, Image, StopCircle, ExpandMore, Close, Save  } from "@mui/icons-material"; 
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
    type,
    types, 
    control: Control,
    menu,
    controlProps,
    edit, 
    dense,
    onSort,
    onChange ,
    sorts = [],
    dropOrder
  } = props;
  const sortProp = sorts.find(s => s.fieldName === alias || s.fieldName?.indexOf(value) > -1 || s.field?.indexOf(value) > -1);
  const { PopComponent, menuPos, audioProp, setAudioProp } = React.useContext(AppStateContext);

  // popover content defaults to user-defined Component
  const [popoverContent, setPopoverContent] = React.useState(popover); 
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [show, setShow] = React.useState(null);

  // when create is specified, this is an EditCell
  if (create) {
    return <EditCell {...props} />
  }

  /**
   * EVENT HANDLERS
   * *********************************************************************** 
   */

  const handleMenu = e => {
    setShow(false)
    const f = menu.find(m => m.label === e);
    f.action()
  }

  const handlePopoverClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);

    // restore popover content to default when menu closes
    setPopoverContent(popover);
  };

  const handleEditClick = event => {
    // change popover content to textbox when editing
    setPopoverContent(<PopoverTextBox {...props} 
      label={`Set value for "${field}"`}
        onChange={onChange} handlePopoverClose={handlePopoverClose} />) 
    setAnchorEl(event.currentTarget);
  }

  const handleSortClick = () => {
    if (sortProp?.index) {
      return alert ('Hard-coded columns cannot be quick-sorted. Use the edit panel!')
    }
    return onSort(text, ascending ? 'DESC' : 'ASC')
  }

  const handleAudioClick = () => {
    setAudioProp(null);
    if (value === audioProp) return;
    return setTimeout(() => {
      setAudioProp(value)
    }, 9)
  }

  const open = Boolean(anchorEl);

  // transform value to string or [empty], if needed
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

  const ascending = sortProp?.direction === 'ASC';

  // cell body click event
  const onClick = async (event) => {
    if (edit) {  
      return handleEditClick(event);
    }

    if (column?.type === 'image') {
      return window.open(value);
    }

    if (column?.type === 'audio') {
      return handleAudioClick();
    }

    if (onSort) {  
      return handleSortClick()
    } 

    // fire any custom action
    action && action ()
  }

  // mask any password text
  const cellText = type === 'password' ? '********' : text;
  
  const arrow = !ascending ? <>&#9650;</> : <>&#9660;</>
  const control = (!!Control)
    ? <Control {...controlProps} />
    : ''

  const cellSelected = selected || (audioProp && (value === audioProp));
  const audioIcon = value === audioProp ? <StopCircle /> : <PlayCircle />
  const mediaIcon = column?.type === 'image' ? <Image /> : audioIcon;
  const cellIcon = column?.type === 'audio' || column?.type === 'image' ? mediaIcon : icon;
  const imageContent = <img alt={cellText} src={cellText} style={{width: 160, height: 'auto'}}  />;

  // when types array is present, render a menu
  const content = !types 
    ?  <Tooltag 
        title={column?.type === 'image' ? imageContent : cellText} 
        selected={cellSelected}
        component={CellText} 
        active={!!action || !!sortProp?.direction ? 1 : 0} 
        clickable={type === 'header' ? 1 : 0} 
        variant={type === 'header' ? 'subtitle2' : 'body2'}>
      {cellText} {sortable && arrow}
    </Tooltag>
    : <QuickMenu caret title={`Value for "${field}"`} options={types} onChange={(e) => !!e && onChange && onChange(e)} value={text} label={text}/>



  return <>
    <Cell 
      selected={cellSelected} 
      control={!!Control} 
      odd={odd} 
      dense={dense} 
      header={type === 'header'} 
      active={edit || !!action ? 1 : 0}
      onMouseEnter={() => setShow(!0)}
      onMouseLeave={() => setShow(!1)}
      style={{ position: 'relative' }}
    >  
    
      {/* in-line options menu */}
      {!!(menu && show) && <Box sx={{position: 'absolute', right: 4, top: 4}}>
        <QuickMenu  
          options={menu.map(f => f.label)} 
          onChange={handleMenu} 
          label={<TinyButton icon={MoreVert} />}
          />
        </Box>}

        <Stack direction="row" sx={{alignItems: 'center'}}> 

          {/* main cell content  */}
          <Stack direction="row" spacing={1} sx={{alignItems: 'center', width: '100%'}}>
            <Flex onClick={onClick}>

              {/* custom controls, if any  */}
              {control} 

              {/* custom or media type icon  */}
              {cellIcon}

              {/* cell value, transformed as needed */}
              {content} 
            </Flex>  
            <Box sx={{flexGrow: 1}} />

            {/* popover trigger */}
            {!!popover && <TinyButton icon={ExpandMore} deg={!open?0:180}  onClick={handlePopoverClick}/>}
          </Stack>

          <Box sx={{flexGrow: 1}} />

          {/* column sort remove button  */}
          {sortProp?.direction && <Tooltag onClick={() => dropOrder(text)} 
            component={Box} title="Remove column sort" sx={{ cursor: 'pointer' }}>
            &times;
          </Tooltag>} 
        </Stack>
    </Cell>

    {/* in-line custom popover   */}
    {!!popoverContent && <PopComponent 
      open={open}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      anchor={menuPos}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      {popoverContent}
    </PopComponent>}


  </>
}

ListCell.defaultProps = {};
export default ListCell;
