import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ColumnSettingsGrid from './ColumnSettingsGrid';
 
afterEach(() => cleanup());
 
describe('<ColumnSettingsGrid/>', () => {
 it('ColumnSettingsGrid mounts without failing', () => {
   render(<ColumnSettingsGrid />);
   expect(screen.getAllByTestId("test-for-ColumnSettingsGrid").length).toBeGreaterThan(0);
 });
});

