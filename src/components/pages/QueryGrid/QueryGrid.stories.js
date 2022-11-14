import React from 'react';
import QueryGrid from './QueryGrid';
 
export default {
 title: 'QueryGrid',
 component: QueryGrid
};
 
const Template = (args) => <QueryGrid {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
