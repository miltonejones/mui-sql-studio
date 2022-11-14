import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import JsonTabs from './JsonTabs';
 
afterEach(() => cleanup());
 
describe('<JsonTabs/>', () => {
 it('JsonTabs mounts without failing', () => {
   render(<JsonTabs />);
   expect(screen.getAllByTestId("test-for-JsonTabs").length).toBeGreaterThan(0);
 });
});

