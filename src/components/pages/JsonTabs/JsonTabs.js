import React from 'react';
import { styled, Box, Tab, Tabs } from '@mui/material';
import { useConfig } from '../../../hooks/useConfig';
import { useSaveQuery } from '../../../hooks/useSaveQuery';
import { useAppHistory } from '../../../hooks/useAppHistory';
 
const Layout = styled(Box)(({ theme }) => ({
 margin: 0
}));
 
const JsonTabs = () => {
  const [value, setValue] = React.useState(0);
  const { getQueries } = useSaveQuery();
  const { getConfigs } = useConfig();
  const { getAppHistory } = useAppHistory();
  const configs = getConfigs();
  const queries = getQueries();
  const history = getAppHistory();
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const content = [
    <pre>
    {JSON.stringify(configs, 0, 2)}
   </pre>,
    <pre>
    {JSON.stringify(queries, 0, 2)}
    </pre>,
    <pre>
    {JSON.stringify(history, 0, 2)}
    </pre>
  ]

 return (
   <Layout data-testid="test-for-JsonTabs">
      <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
        <Tab label="Configs"   />
        <Tab label="Saved Queries"  />
        <Tab label="History" />
      </Tabs>
    {content[value]}
   </Layout>
 );
}
JsonTabs.defaultProps = {};
export default JsonTabs;
