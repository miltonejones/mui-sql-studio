import React from 'react';
import JsonTabs from './JsonTabs';
 
export default {
 title: 'JsonTabs',
 component: JsonTabs
};
 
const Template = (args) => <JsonTabs {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
