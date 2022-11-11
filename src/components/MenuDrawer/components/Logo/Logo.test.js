import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Logo from './Logo';
 
afterEach(() => cleanup());
 
describe('<Logo/>', () => {
 it('Logo mounts without failing', () => {
   render(<Logo />);
   expect(screen.getAllByTestId("test-for-Logo").length).toBeGreaterThan(0);
 });
});

