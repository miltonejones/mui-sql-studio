import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import SearchRow from './SearchRow';
 
afterEach(() => cleanup());
 
describe('<SearchRow/>', () => {
 it('SearchRow mounts without failing', () => {
   render(<SearchRow />);
   expect(screen.getAllByTestId("test-for-SearchRow").length).toBeGreaterThan(0);
 });
});

