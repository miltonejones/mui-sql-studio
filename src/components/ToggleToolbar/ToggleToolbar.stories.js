import React from 'react';

import { 
  BrowserRouter,   
} from "react-router-dom";

import ToggleToolbar from './ToggleToolbar';
 
export default {
  title: 'Example/ToggleToolbar',
  component: ToggleToolbar, 
};
 
const Template = (args) => <BrowserRouter><ToggleToolbar {...args} /></BrowserRouter>;

export const Primary = Template.bind({});

Primary.args = {
  getAppHistory: () => [],
  getFavorites: () => [],
}
