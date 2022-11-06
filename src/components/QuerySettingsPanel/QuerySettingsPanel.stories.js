import React from 'react';
import { useConfig } from '../../hooks/useConfig';
import QuerySettingsPanel from './QuerySettingsPanel';
 
export default {
  title: 'Example/QuerySettingsPanel',
  component: QuerySettingsPanel, 
};
 
const Template = (args) => {
  const [sql, setSQL] = React.useState(null);
  const { getConfigs } = useConfig();
  const configs = getConfigs();
  console.log ({ configs })
  return <>
  {!!sql && <pre>
    {sql}
    </pre>}
  <QuerySettingsPanel onCommit={setSQL} config={configs['Video Database']} {...args} />
  </>
};

export const Primary = Template.bind({});

Primary.args = {
  tablename: 'bucketTracks'
}