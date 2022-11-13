import React from 'react';
import ColumnSettingsGrid from './ColumnSettingsGrid';
 
export default {
 title: 'ColumnSettingsGrid',
 component: ColumnSettingsGrid
};
 
const Template = (args) => <ColumnSettingsGrid {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
