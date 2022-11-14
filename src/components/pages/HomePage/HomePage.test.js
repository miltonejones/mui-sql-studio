import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import HomePage from './HomePage';
 
afterEach(() => cleanup());
 
describe('<HomePage/>', () => {
 it('HomePage mounts without failing', () => {
   render(<HomePage />);
   expect(screen.getAllByTestId("test-for-HomePage").length).toBeGreaterThan(0);
 });
});

