import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import TableGrid from './TableGrid';
 
afterEach(() => cleanup());
 
describe('<TableGrid/>', () => {
 it('TableGrid mounts without failing', () => {
   render(<TableGrid />);
   expect(screen.getAllByTestId("test-for-TableGrid").length).toBeGreaterThan(0);
 });
});

