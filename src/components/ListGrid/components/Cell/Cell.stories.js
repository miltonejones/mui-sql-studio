import React from 'react';
import Cell from './Cell';
 
export default {
 title: 'Cell',
 component: Cell
};
 
const Template = (args) => <Cell {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
