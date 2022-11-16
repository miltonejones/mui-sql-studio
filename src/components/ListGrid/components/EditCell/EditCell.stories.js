import React from 'react';
import EditCell from './EditCell';
 
export default {
 title: 'EditCell',
 component: EditCell
};
 
const Template = (args) => <EditCell {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
