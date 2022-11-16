import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import EditCell from './EditCell';
 
afterEach(() => cleanup());
 
describe('<EditCell/>', () => {
 it('EditCell mounts without failing', () => {
   render(<EditCell />);
   expect(screen.getAllByTestId("test-for-EditCell").length).toBeGreaterThan(0);
 });
});

