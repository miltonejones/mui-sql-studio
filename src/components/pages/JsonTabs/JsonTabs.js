import React from 'react';
import { styled, Box } from '@mui/material';
import { useConfig } from '../../../hooks/useConfig';
import { useSaveQuery } from '../../../hooks/useSaveQuery';
 
const Layout = styled(Box)(({ theme }) => ({
 margin: theme.spacing(4)
}));
 
const JsonTabs = () => {
  const { getQueries } = useSaveQuery();
  const { getConfigs } = useConfig();
  const configs = getConfigs();
  const queries = getQueries();
 return (
   <Layout data-testid="test-for-JsonTabs">
   <pre>
    {JSON.stringify(configs, 0, 2)}
   </pre>
     <pre>
      {JSON.stringify(queries, 0, 2)}
     </pre>
   </Layout>
 );
}
JsonTabs.defaultProps = {};
export default JsonTabs;
