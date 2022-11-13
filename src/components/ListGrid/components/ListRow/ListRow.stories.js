import React from 'react';
import ListRow from './ListRow';
 
export default {
 title: 'ListRow',
 component: ListRow
};
 
const Template = (args) => <ListRow {...args} />;
export const DefaultView = Template.bind({});
DefaultView.args = {};
