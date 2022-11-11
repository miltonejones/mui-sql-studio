import React from 'react';
import Panel from './Panel';
 
export default {
 title: 'Panel',
 component: Panel
};
 
const Template = (args) => <Panel {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
