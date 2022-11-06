import React from 'react';
import ListGrid  from './ListGrid';
import { useConfig } from '../../hooks/useConfig';
 
export default {
  title: 'Example/ListGrid',
  component: ListGrid, 
};

const configRow = (conf) => [
  {
    field: 'title',
    value: conf.title
  },
  {
    field: 'host',
    value: conf.host
  },
  {
    field: 'user',
    value: conf.user
  },
  {
    field: 'password',
    value: conf.password,
    type: 'password'
  },
  {
    field: 'database',
    value: conf.database
  },
]

const Template = (args) => { 
  const { getConfigs, saveConfig } = useConfig();
  const configs = getConfigs();
  const rows = Object.keys(configs).map(f => configRow({...configs[f], title: f}));
  return <ListGrid rows={rows} />
}

export const Primary = Template.bind({});
