import * as React from 'react';
import {   
  FormControlLabel,
  Grid, 
  MenuItem, 
  Select,
  Switch,
  TextField,  
  Dialog, 
  DialogActions, 
  DialogTitle,
  DialogContent, 
  Typography,
  Divider,
  Link,
  styled} from '@mui/material';

import { execQuery } from '../../connector/dbConnector';
import { TextBtn } from '../Control/Control';

const AU = styled(Link)(({ theme }) => ({
  cursor: 'pointer',
  color: theme.palette.primary.dark,
  marginLeft: 30,
  '&:hover': {
    textDecoration: 'underlined'
  }
}))

const fields = [
  {
    field: 'title',
    label: "Connection Name"
  },
  
  {
    field: 'host',
    label: "Host Name"
  },
  
  {
    field: 'user',
    label: "Username"
  },
  
  {
    field: 'password',
    label: "Password",
    type: "password"
  },
  
]


export default function ConnectionModal({open, connection = {}, onChange, onClose, component: Component = Dialog}) {
  const [checked, setChecked] = React.useState(false);
  const [db, setDb] = React.useState([])

  const handleChange = async (event) => {
    setChecked(event.target.checked); 
    if (event.target.checked && !db.length) { 
      const b = await execQuery(connection, 'select SCHEMA_NAME from information_schema.SCHEMATA');
      const rows = b.rows.map(e => e.SCHEMA_NAME)
      setDb(rows)
    }
  };

  const isValid = () => !!connection && !Object.keys(connection).some(f => !connection[f])
 
  const maxWidth = 500;
  
  return <Component onClose={() => onClose(false)}   open={open}>
    <DialogTitle sx={{ maxWidth }} >
      <Typography sx={{mb: 0}} variant="h6">Connection Setup</Typography> 
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ maxWidth }} > 
      <Grid container spacing={2}>

      {!!connection && fields.map(field => <Grid xs={12} item  key={field.label}>
        <TextField autoComplete="off" value={connection[field.field]} onChange={(e) => {
          onChange && onChange(field.field,  e.target.value) 
        } } fullWidth  sx={{ maxWidth }}  size="small" label={field.label} type={field.type}/>
      </Grid>)}

      <Grid item xs={5}>
        <FormControlLabel
          label="Choose database "
          control={ <Switch
          disabled={!isValid()} 
            checked={checked}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'controlled' }}
          />}
        />
      
      </Grid>
        {!!isValid() && <Grid sx={{alignItems: 'center'}} xs={7} item>
          {!!db.length ? <Select value={connection.database} 
            disabled={!checked} size="small" fullWidth >
            {db.map(d => <MenuItem
            onClick={() => onChange('database', d)}
            value={d}
            key={d}>{d}</MenuItem>)}
          </Select> : <>
          Using <b>{connection.database}</b>{" "}
          <AU onClick={() => handleChange({target: {checked: true}})}>Change</AU>
          </>}
        </Grid>}
      </Grid>
    
    </DialogContent>
    
    <Divider />
    <DialogActions sx={{pr: 3}}>
      <TextBtn sx={{mr: 1}} variant="outlined" onClick={() => onClose(false)}>close</TextBtn>
      <TextBtn disabled={!isValid()}  variant="contained" onClick={() => onClose(connection)}>save</TextBtn>
    </DialogActions>
  </Component>

}
 