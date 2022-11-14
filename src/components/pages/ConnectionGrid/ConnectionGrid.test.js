import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ConnectionGrid from './ConnectionGrid';
 
afterEach(() => cleanup());
 
describe('<ConnectionGrid/>', () => {
 it('ConnectionGrid mounts without failing', () => {
   render(<ConnectionGrid />);
   expect(screen.getAllByTestId("test-for-ConnectionGrid").length).toBeGreaterThan(0);
 });
});

