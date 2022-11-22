import React from 'react';
import { InputAdornment, TextField, IconButton } from '@mui/material';
import { Cell } from '..'
import { Close } from '@mui/icons-material';
import { Tooltag } from '../../..'
 

function SearchRow({ 
    row , 
    searches = [], 
    onChange, 
    onClear
  }) {
  const params = {};
  searches.map(s => Object.assign(params, {[s.field]: s.value}))
  const [state, setState] = React.useState(params)
  return <tr>
    {row.map((cell, i) => {
      
      const adornment = !state[cell.value] ? {} : {
        endAdornment: <InputAdornment position="end">
          <Tooltag component={IconButton} title={`Clear "${cell.value}" filter`} size="small" sx={{width: 18, height: 18}} onClick={() => {
            setState(s => ({...s, [cell.value]: ''}))
            onClear && onClear(cell.value, state[cell.value])
          }}>
            <Close sx={{width: 16, height: 16}} />
          </Tooltag>
        </InputAdornment>,
      } 
  
      return (<Cell key={i} dense>
        <TextField 
          fullWidth 
          autoComplete="off" 
          size="small" 
          value={state[cell.value]} 
          onChange={(e) => setState(s => ({ ...s, [cell.value]: e.target.value }))} 
          sx={{minWidth: 100}} 
          onKeyUp={e => e.keyCode === 13 && onChange && onChange(cell.value, state[cell.value])}
          placeholder={`"${cell.value}" Filter`} 
          label="Filter" 
          InputProps={adornment}
        />
      </Cell>)})}
    <Cell dense header>&nbsp;</Cell>
  </tr>
}


SearchRow.defaultProps = {};
export default SearchRow;
