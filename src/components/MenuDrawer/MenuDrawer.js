import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {  InputAdornment, Box, Stack, Collapse, IconButton, TextField, Typography, styled} from '@mui/material';
import {  
  useNavigate, 
} from "react-router-dom";

import { PushPin, ExpandMore , Close} from '@mui/icons-material';

export const LogoURL = 'https://associate-ui.s3.amazonaws.com/kisspng-mysql-relational-database-management-system-logo-m-mysql-instalaci%C3%B3n-y-creaci%C3%B3n-usuario-atrum-5b649e7bb60bf3.4045674715333208277457.png';

export const Logo = ({ short }) =>{ 
  const navigate = useNavigate()
  return <Stack onClick={() => navigate('/')} sx={{cursor: 'pointer', ml: 2, mr: 4, width: short ? 154 : 300 , alignItems: 'center'}} spacing={1} direction="row" >
    <img alt="logo" src={LogoURL} style={{height:  32, width: 'auto'}}/>
    <Typography>MySQL Studio</Typography>
  </Stack>
}

const RotateButton = styled(IconButton)(({ deg = 90 }) => ({
  transition: 'transform 0.2s linear', 
  transform: `rotate(${deg}deg)`
}));

const Panel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  position: 'absolute', 
  top: 0, 
  left: 0,
  height: '100vh',
  minWidth: 300,
  boxShadow: `
    0px 5px 5px -3px rgb(0 0 0 / 20%), 
    0px 8px 10px 1px rgb(0 0 0 / 14%), 
    0px 3px 14px 2px rgb(0 0 0 / 12%)`,
}))



export default function MenuDrawer({ label = 'Dashboard', report, options = []}) {

  const [filterText, setFilterText] = React.useState('')

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [pinned, setPinned] = React.useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {   
    setAnchorEl(null);
  };

  const pinMenu = () => {
    setPinned(!pinned)
    report && report(label, !pinned)
  }

  const Tag = pinned ? Panel : Menu;

  const adornment = !filterText.length ? {} : {
    endAdornment: <InputAdornment position="end">
      <IconButton onClick={() => setFilterText('')}>
        <Close />
      </IconButton>
    </InputAdornment>,
  }

  
  return (
    <div>
      <Collapse orientation="horizontal" in={!pinned}>
     <Button
      sx={{mr: 1}}
        color="inherit"
        id="demo-positioned-button"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {label}
      </Button> </Collapse>
      <Tag
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >


      {!!pinned && ( <Stack sx={{alignItems: 'center', mt: 0.5}} direction="row">
        <Logo short />
        <Box sx={{flexGrow: 1}} />
        <Button
        color="inherit"
        sx={{mt: 0,  mb: 0, mr: 2, textDecoration: 'underline'}}
        id="demo-positioned-button"
       
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {label}
      </Button>

      </Stack> )}

     
        <MenuItem >
          <Stack spacing={2} direction="row">
            <TextField size="small" label="Filter" value={filterText} autoComplete="off"
              onChange={e => setFilterText(e.target.value)} 
              InputProps={adornment}/>
            <RotateButton color="inherit" onClick={() => pinMenu()} deg={pinned ? 45 : 0}>
              <PushPin />
            </RotateButton>
          </Stack> 
        </MenuItem>
        <MenuTree filterText={filterText} pinned={pinned} options={options} handleClose={handleClose}/> 
      </Tag>
    </div>
  );
}


const MenuTree = ({options, spaces = 0, pinned, handleClose, filterText}) => {
  const [open, setOpen] = React.useState(true)
  const hue = pinned ? 'white' : 'gray';
  const borderLeft =  !spaces  ? '' : ('solid 1px ' + hue)
  const execClose = (e, opt) => {
    if (!!opt.descendants) {
      return setOpen(!open);
    }
    !!opt.action && opt.action(opt)
    handleClose(e)
  } 
  return <>
  {options
  .filter(opt => !filterText || opt.title.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
  .map((opt, i) => <>
    <MenuItem key={i} sx={{ml: spaces, borderLeft, }} onClick={e => execClose(e, opt)}>
      <Stack sx={{alignItems: 'center' }} direction="row">
        <Typography>
          {opt.title}
        </Typography>
        <Box sx={{flexGrow: 1}} />
       {!!opt.descendants &&  <RotateButton deg={open ? 180 : 0} onClick={() => setOpen(!open)} >
          <ExpandMore />
        </RotateButton>}
      </Stack>
    </MenuItem>
    {opt.descendants && <Collapse in={open}><MenuTree filterText={filterText} pinned={pinned} handleClose={handleClose} options={opt.descendants} spaces={spaces + 4}/></Collapse>}
  </>)} 
  </>
}