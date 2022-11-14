import React from 'react';
import TableGrid from './TableGrid';
 
export default {
 title: 'TableGrid',
 component: TableGrid
};
 
const Template = (args) => <TableGrid {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
