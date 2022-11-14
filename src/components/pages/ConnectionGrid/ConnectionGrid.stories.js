import React from 'react';
import ConnectionGrid from './ConnectionGrid';
 
export default {
 title: 'ConnectionGrid',
 component: ConnectionGrid
};
 
const Template = (args) => <ConnectionGrid {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
