import React from 'react';
import { TextField } from '@mui/material';
import { QuickSelect } from '../../..';
import { Cell } from '..';
  
 
const EditCell = (props) => {
  const { value, types, field, edit , onChange} = props;
  let content = edit ? <TextField label={field}
  onChange={e =>  onChange && onChange(e.target.value) }
      size="small" /> : '--';

  if (types) {
    content = <QuickSelect small options={types} onChange={(e) => !!e && onChange && onChange(e)} value={value} label={field}/>
  }
 return (
   <Cell>
     {content}
   </Cell>
 );
}
EditCell.defaultProps = {};
export default EditCell;
