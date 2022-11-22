import React from 'react';
import MenuTree from './MenuTree';
 
export default {
 title: 'MenuTree',
 component: MenuTree
};
 
const Template = (args) => <MenuTree {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
