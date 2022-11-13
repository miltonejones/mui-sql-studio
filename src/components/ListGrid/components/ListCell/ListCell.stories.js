import React from 'react';
import ListCell from './ListCell';
 
export default {
 title: 'ListCell',
 component: ListCell
};
 
const Template = (args) => <ListCell {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
