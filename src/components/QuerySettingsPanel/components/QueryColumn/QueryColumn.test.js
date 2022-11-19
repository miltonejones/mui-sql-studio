import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import QueryColumn from './QueryColumn';
 
afterEach(() => cleanup());
 
describe('<QueryColumn/>', () => {
 it('QueryColumn mounts without failing', () => {
   render(<QueryColumn />);
   expect(screen.getAllByTestId("test-for-QueryColumn").length).toBeGreaterThan(0);
 });
});

