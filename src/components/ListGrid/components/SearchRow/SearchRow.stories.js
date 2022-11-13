import React from 'react';
import SearchRow from './SearchRow';
 
export default {
 title: 'SearchRow',
 component: SearchRow
};
 
const Template = (args) => <SearchRow {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
