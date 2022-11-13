import React from 'react';
import { styled, InputAdornment, TextField, IconButton, Box } from '@mui/material';
import { Cell } from '..'
import { Close } from '@mui/icons-material';
 

function SearchRow({ row , searches = [], onChange, onClear}) {
  const params = {};
  searches.map(s => Object.assign(params, {[s.field]: s.value}))
  const [state, setState] = React.useState(params)
  return <tr>
    {row.map((cell, i) => {
      
      const adornment = !state[cell.value] ? {} : {
        endAdornment: <InputAdornment position="end">
          <IconButton size="small" onClick={() => {
            setState(s => ({...s, [cell.value]: ''}))
            onClear && onClear(cell.value, state[cell.value])
          }}>
            <Close />
          </IconButton>
        </InputAdornment>,
      }

  
      return (<Cell dense>
      <TextField fullWidth autoComplete="off" size="small" 
        value={state[cell.value]} onChange={(e) => setState(s => ({ ...s, [cell.value]: e.target.value }))} 
        sx={{minWidth: 100}} onKeyUp={e => e.keyCode === 13 && onChange && onChange(cell.value, state[cell.value])}
        placeholder={`"${cell.value}" Filter`} label="Search" InputProps={adornment}/>
    </Cell>)})}
    <Cell dense header>&nbsp;</Cell>
  </tr>
}


SearchRow.defaultProps = {};
export default SearchRow;
