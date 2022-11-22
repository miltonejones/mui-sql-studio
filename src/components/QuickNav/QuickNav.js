import React from 'react';
import { styled, Box, Autocomplete, TextField } from '@mui/material';
import { useConfig } from '../../hooks/useConfig';
import { useSaveQuery } from '../../hooks/useSaveQuery';
import { formatConnectName } from '../../util'; 
 
const Layout = styled(Box)(({ theme }) => ({
 margin: 0
}));
 
const white = 'rgba(255, 255, 255, 0.4)';
export const TextBox = styled(TextField)(({ theme }) => ({ 
  maxWidth: 220,
  border: 'solid 1px ' + white,
  borderRadius: 5,
  '& .MuiInputBase-input': {
    color: white
  } ,
  '& .MuiFormLabel-root': {
    color: white
  }
}));

const QuickNav = () => {
  const navigate = (href) => window.location.replace(href); 
  const { getConfigs  } = useConfig()
  const { getQueries } = useSaveQuery();
  const configs = getConfigs();
  const queries = getQueries();

  
  const options = Object.keys(configs).map(label => ({
    label, 
    action: () => navigate(`/connection/${formatConnectName(label)}`)
  })).concat(
    Object.keys(queries).map(label => {
      const { schema, tablename, connectionID } = queries[label];
      return {
        label, 
        action: () => navigate(`/lists/${connectionID}/${schema}/${tablename}/${formatConnectName(label)}`)
      }
    })
  );

 return (
   <Layout data-testid="test-for-QuickNav">
   
  <Autocomplete  
    disablePortal
    disableClearable
    autoComplete
    autoHighlight
    onChange={(event, newValue) => {
      newValue.action();
    }}
    sx={{mr: 1, minWidth: 120}}
    size="small"  
    options={options} 
    renderInput={(params) => <TextBox {...params} 
           label="Jump to page" 
          placeholder="Type page name" size="small" />}
 />
   </Layout>
 );
}
QuickNav.defaultProps = {};
export default QuickNav;
