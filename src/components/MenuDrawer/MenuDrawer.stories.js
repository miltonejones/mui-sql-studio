import React from 'react';

import MenuDrawer from './MenuDrawer';
 
export default {
  title: 'Example/MenuDrawer',
  component: MenuDrawer, 
};
 
const Template = (args) => <MenuDrawer {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  label: 'All',
  options: [
    {
      title: 'Connections',
      descendants: [
        {
          title: 'Another menu item'
        },
        {
          title: 'New...'
        }
      ]
    }, 
  ]
}