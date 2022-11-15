import React from 'react';
import QuickNav from './QuickNav';
 
export default {
 title: 'QuickNav',
 component: QuickNav
};
 
const Template = (args) => <QuickNav {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
