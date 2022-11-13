import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Cell from './Cell';
 
afterEach(() => cleanup());
 
describe('<Cell/>', () => {
 it('Cell mounts without failing', () => {
   render(<Cell />);
   expect(screen.getAllByTestId("test-for-Cell").length).toBeGreaterThan(0);
 });
});

