import React from "react";
import { 
  FormControlLabel, 
  Switch, 
  Box, 
  Button, 
  Card, 
  TextField, 
  Stack,
  Typography,
  IconButton, 
  InputAdornment,  
  styled } from "@mui/material";
import Tooltip from "@mui/material/Tooltip"; 
import { ExpandMore, FilterAlt, Save, Close } from "@mui/icons-material";
import { AppStateContext } from '../../hooks/AppStateContext';
 

export const PopoverTextBox = ({ label, value, onChange, handlePopoverClose }) => {
  const [typedVal, setTypedVal] = React.useState(value);
  return <Stack sx={{p: 2, minWidth: 300}} spacing={1}>
    <Typography>{label}</Typography>
    <TextField label={label} size="small" value={typedVal} onChange={ (e) => { 
      setTypedVal(e.target.value) 
    } } autoComplete="off"/>
    <Flex> 
    <Spacer />
    <TinyButton icon={Close} onClick={handlePopoverClose} />
    <TinyButton icon={Save} onClick={() => {  
        !!typedVal && onChange && onChange(typedVal);
        handlePopoverClose()
    }}/>
  </Flex>
</Stack>
}


export const PopoverInput = ( { label, value, onChange, anchorEl, setAnchorEl } ) => { 
  const { PopComponent, menuPos } = React.useContext(AppStateContext);

  const open = Boolean(anchorEl);
 

  const handlePopoverClose = () => { 
    onChange(false);
  };

  return <PopComponent 
      open={open}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      anchor={menuPos}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <PopoverTextBox 
        label={label}
        value={value}
        handlePopoverClose={handlePopoverClose}
        onChange={value => {
          onChange && onChange(value)
        }}
      />
    </PopComponent>
}



export const OptionSwitch = ({ options = [], value, onChange }) => {

  const [checked, setChecked] = React.useState(options[0] === value)

  return   <FormControlLabel
      label={checked ? options[0] : options[1]}
      control={ <Switch  
        checked={checked}
        onChange={e => {
          setChecked(e.target.checked);
          onChange(e.target.checked ? options[0] : options[1])
        }} 
      />}
    />
}

export const Flex = styled(Box)(({ theme, baseline, wrap, spacing = 1 }) => ({
 display: "flex",
 alignItems: baseline ? "flex-start" : "center",
 gap: theme.spacing(spacing),
 flexWrap: wrap ? "wrap" : "nowrap",
}));
 
export const Pane = styled(Card)(({ collapsed, theme }) => ({
 width: collapsed ? `calc(25% - 8px)` : `calc(100% - ${theme.spacing(8)})`,
 padding: theme.spacing(1),
 transition: "width 0.3s ease-in",
}));
 
export const Tooltag = ({
 component: Component,
 title,
 children,
 ...props
}) => { 
  return (
    <Tooltip placement="left-start" arrow title={title}> 

      <Component {...props}>
       {children}</Component>
 
    </Tooltip>
   )
};
 
export const Spacer = styled(Box)(() => ({
 flexGrow: 1,
}));
 
export const TextBtn = styled(Button)(({ theme }) => ({
 textTransform: "capitalize",
 whiteSpace: "nowrap",
 borderRadius: '1rem',
 padding: theme.spacing(0.5, 2),
 boxShadow: 'none'
}));
 
export const UL = styled("ul")(({ theme, margin, collapsed }) => ({
 padding: 0,
 margin: margin ? theme.spacing(4) : 0,
 // marginBottom: theme.spacing(6),
 listStyle: "none",
 width: `calc(100% - ${margin ? theme.spacing(8) : 0})`,
 "& li": {
   display: "flex",
   alignItems: "center",
   float: collapsed ? "left" : "none",
   width: collapsed ? `calc(25% - 8px)` : "100%",
 },
}));
 
export const Text = styled(Box)(({ small, on }) => ({
 cursor: "pointer",
 position: "relative",
 fontSize: small ? "0.9rem" : "1rem",
 "&:hover": {
   textDecoration: "underline",
   color: "#37a",
 }, 
}));
 
export const Arrow = styled(ExpandMore)(({ on }) => ({
 transform: on ? "rotate(450deg)" : "rotate(270deg)",
 transition: "transform 0.3s ease-in",
}));
 
/**
* * exposes clipboard copy method to components
* @returns copy method and copied state
*/
export function useClipboard() {
 const [copied, setCopied] = React.useState(false);
 const copy = (datum) => {
   navigator.clipboard
     // * save data to clipboard
     .writeText(datum)
     .then(() => {
       // * add clipboard data to copied state
       setCopied(datum);
       // * clear copied state after pause for various coolness
       setTimeout(() => setCopied(false), 299);
     })
     .catch(console.warn);
 };
 // return method and state
 return { copy, copied };
}

export const RotateButton = styled(IconButton)(({ deg = 0 }) => ({
  transition: 'transform 0.125s linear', 
  transform: `rotate(${deg}deg)`
}));

export const RotateExpand = styled(ExpandMore)(({ deg = 0 }) => ({
  transition: 'transform 0.125s linear', 
  transform: `rotate(${deg}deg)`
}));


export const SearchBox = ({value, onChange, onClose, startIcon = true, ...props}) => {
  const startAdornment = !startIcon ? null  : <InputAdornment position="start">
    <IconButton size="small">
      <FilterAlt />
    </IconButton>
  </InputAdornment>

  const adornment = !value?.length ? {startAdornment} : {
    startAdornment,
    endAdornment: <InputAdornment position="end">
      <IconButton size="small" onClick={onClose}>
        <Close />
      </IconButton>
    </InputAdornment>,
  }

  return  <TextField size="small" {...props} value={value} autoComplete="off" onChange={onChange} 
  InputProps={adornment} autoFocus/>
};


export const Area = styled(Card)(({ theme, breadcrumbs, pinned }) => ({
  height: `calc(100vh - ${breadcrumbs ? 212 : 182}px)`,
  backgroundColor: '#f5f5f5 ', 
  position: 'absolute',
  top: breadcrumbs ? 94 : 64,
  left: pinned ? 340 : 0,
  width: !pinned ? 'calc(100vw - 96px)' : 'calc(100vw - 436px)',
  transition: 'left 0.1s linear', 
  margin: theme.spacing(0, 2),
  padding: theme.spacing(1, 4, 10, 4),
  borderRadius: 8,
  overflow: 'auto'
}));


export const TextBox = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(1), 
  marginBottom: theme.spacing(1),
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
    lineHeight: 1.5,
    fontFamily: 'Courier'
  }
}));

export const TinyButton = ({icon: Icon, ...props}) => <RotateButton {...props}  sx={{ ...props.sx, width: 18, height: 18}}>
  <Icon sx={{width: 16, height: 16}} />
</RotateButton>
