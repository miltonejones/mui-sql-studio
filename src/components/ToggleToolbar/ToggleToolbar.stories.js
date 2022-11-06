import React from 'react';

import ToggleToolbar from './ToggleToolbar';
 
export default {
  title: 'Example/ToggleToolbar',
  component: ToggleToolbar, 
};
 
const Template = (args) => <ToggleToolbar {...args} />;

export const Primary = Template.bind({});
