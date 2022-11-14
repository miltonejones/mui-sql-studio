import React from 'react';
import QueryAnalyzer from './QueryAnalyzer';
 
export default {
 title: 'QueryAnalyzer',
 component: QueryAnalyzer
};
 
const Template = (args) => <QueryAnalyzer {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
