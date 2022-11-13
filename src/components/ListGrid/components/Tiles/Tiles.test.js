import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Tiles from './Tiles';
 
afterEach(() => cleanup());
 
describe('<Tiles/>', () => {
 it('Tiles mounts without failing', () => {
   render(<Tiles />);
   expect(screen.getAllByTestId("test-for-Tiles").length).toBeGreaterThan(0);
 });
});

