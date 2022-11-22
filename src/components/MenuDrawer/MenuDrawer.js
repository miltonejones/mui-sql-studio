import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu'; 
import { MenuTree, Logo, Panel } from './components';
import { TinyButton } from '..';
import { InputAdornment, Box, Stack, Collapse, IconButton, TextField, styled} from '@mui/material'; 

import { PushPin, Close, FilterAlt} from '@mui/icons-material';
 

const FilterBox = styled(TextField)(({ white }) => ({
  '& .MuiFormLabel-root': {
    color: white ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  }
}));  

const MenuNoShade = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    boxShadow: `
      0px 4px 1px 1px rgb(0 0 0 / 20%), 
      2px 5px 1px 0px rgb(0 0 0 / 14%)`
  }
}))


export default function MenuDrawer({ 
  label = 'Dashboard',  
  pinnedTab,
  setPinnedTab,
  options = []

}) {

  const [filterText, setFilterText] = React.useState('')

  const [anchorEl, setAnchorEl] = React.useState(null); 
  const pinned = pinnedTab === label;

  // event handlers
  // --------------------------------------------------------------------'
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {   
    setAnchorEl(null);
  }; 

  const Component = pinned ? Panel : MenuNoShade;
 
  const startAdornment = pinned ? null  : <InputAdornment position="start">
  <IconButton sx={{width: 18, height: 18}} size="small">
    <FilterAlt sx={{width: 16, height: 16}} />
  </IconButton>
</InputAdornment>

  const adornment = !filterText.length ? {startAdornment} : {
    startAdornment,
    endAdornment: <InputAdornment position="end">
      <IconButton sx={{width: 18, height: 18}} size="small" onClick={() => setFilterText('')}>
        <Close sx={{width: 16, height: 16}} />
      </IconButton>
    </InputAdornment>,
  }

  
  return (
    <div>

      {/* primary trigger button collapses when menu is pinned */}
      <Collapse orientation="horizontal" in={!pinned}>
        <Button
          sx={{mr: 1, borderRadius: t => t.spacing(.5,.5,0,0),
            backgroundColor: t => open ? 'white' : t.palette.primary.dark }}
          color={open ? "primary" : "inherit"}
          id="demo-positioned-button" 
          onClick={handleClick}
        >
          {label}
        </Button> 
      </Collapse>
      
      {/* menu/drawer wrapper */}
      <Component
        sx={{maxWidth: pinned?320:'inherit', boxShadow: 0 }}
        dense 
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >

        {/* pinned menu toolbar */}
        {!!pinned && ( 
        <Stack sx={{
            alignItems: 'center',
            backgroundColor: theme => theme.palette.primary.dark,
            m: 0,
            height: 48 }
            } direction="row">
            <Logo short />
            <Box sx={{flexGrow: 1}} />
            <Button
            color="inherit"
            sx={{mt: 0,  mb: 0, mr: 2, borderBottom: 'solid 2px white', borderRadius: 0}}
            id="demo-positioned-button"
          
            aria-controls={open ? 'demo-positioned-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            {label}
          </Button>

        </Stack> )}

        {/* search box */}
        <Box sx={{p: 2}}>
          <Stack spacing={2} sx={{alignItems: 'center'}} direction="row">
            <FilterBox white={pinned} size="small" label="Filter" value={filterText} autoComplete="off"
              onChange={e => setFilterText(e.target.value)} 
              InputProps={adornment}/>
            <TinyButton
            icon={PushPin}
            color="inherit" onClick={() => setPinnedTab(pinnedTab === label ? '' : label)} deg={pinned ? 45 : 0}/>
          </Stack> 
        </Box>

        <MenuTree filterText={filterText} pinned={pinned} options={options} handleClose={handleClose}/> 
      </Component>
    </div>
  );
}

 