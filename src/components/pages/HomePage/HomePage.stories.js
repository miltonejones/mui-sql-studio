import React from 'react';
import HomePage from './HomePage';
 
export default {
 title: 'HomePage',
 component: HomePage
};
 
const Template = (args) => <HomePage {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
