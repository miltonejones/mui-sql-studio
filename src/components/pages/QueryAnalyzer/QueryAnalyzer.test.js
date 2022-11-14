import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import QueryAnalyzer from './QueryAnalyzer';
 
afterEach(() => cleanup());
 
describe('<QueryAnalyzer/>', () => {
 it('QueryAnalyzer mounts without failing', () => {
   render(<QueryAnalyzer />);
   expect(screen.getAllByTestId("test-for-QueryAnalyzer").length).toBeGreaterThan(0);
 });
});

