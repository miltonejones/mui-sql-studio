import React from 'react';
import QueryColumn from './QueryColumn';
 
export default {
 title: 'QueryColumn',
 component: QueryColumn
};
 
const Template = (args) => <QueryColumn {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
