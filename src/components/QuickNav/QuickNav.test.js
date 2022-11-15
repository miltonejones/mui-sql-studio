import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import QuickNav from './QuickNav';
 
afterEach(() => cleanup());
 
describe('<QuickNav/>', () => {
 it('QuickNav mounts without failing', () => {
   render(<QuickNav />);
   expect(screen.getAllByTestId("test-for-QuickNav").length).toBeGreaterThan(0);
 });
});

