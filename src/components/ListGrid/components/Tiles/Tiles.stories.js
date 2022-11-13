import React from 'react';
import Tiles from './Tiles';
 
export default {
 title: 'Tiles',
 component: Tiles
};
 
const Template = (args) => <Tiles {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
