import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import QueryGrid from './QueryGrid';
 
afterEach(() => cleanup());
 
describe('<QueryGrid/>', () => {
 it('QueryGrid mounts without failing', () => {
   render(<QueryGrid />);
   expect(screen.getAllByTestId("test-for-QueryGrid").length).toBeGreaterThan(0);
 });
});

