import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Panel from './Panel';
 
afterEach(() => cleanup());
 
describe('<Panel/>', () => {
 it('Panel mounts without failing', () => {
   render(<Panel />);
   expect(screen.getAllByTestId("test-for-Panel").length).toBeGreaterThan(0);
 });
});

