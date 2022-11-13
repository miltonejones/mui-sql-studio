import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ListCell from './ListCell';
 
afterEach(() => cleanup());
 
describe('<ListCell/>', () => {
 it('ListCell mounts without failing', () => {
   render(<ListCell />);
   expect(screen.getAllByTestId("test-for-ListCell").length).toBeGreaterThan(0);
 });
});

