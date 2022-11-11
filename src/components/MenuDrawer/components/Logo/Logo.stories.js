import React from 'react';
import Logo from './Logo';
 
export default {
 title: 'Logo',
 component: Logo
};
 
const Template = (args) => <Logo {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
