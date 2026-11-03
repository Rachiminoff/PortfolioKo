import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

test('App mounts without crashing', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(document.body).not.toBeEmptyDOMElement();
  // The ErrorBoundary fallback must not be showing: the app really rendered.
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('ErrorBoundary shows a recoverable message instead of a blank page', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const Boom = () => {
    throw new Error('chunk failed');
  };
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  spy.mockRestore();
});
