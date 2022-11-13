import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ListRow from './ListRow';
 
afterEach(() => cleanup());
 
describe('<ListRow/>', () => {
 it('ListRow mounts without failing', () => {
   render(<ListRow />);
   expect(screen.getAllByTestId("test-for-ListRow").length).toBeGreaterThan(0);
 });
});

