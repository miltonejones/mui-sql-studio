import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import MenuTree from './MenuTree';
 
afterEach(() => cleanup());
 
describe('<MenuTree/>', () => {
 it('MenuTree mounts without failing', () => {
   render(<MenuTree />);
   expect(screen.getAllByTestId("test-for-MenuTree").length).toBeGreaterThan(0);
 });
});

