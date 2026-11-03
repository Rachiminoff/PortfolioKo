// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// react-router v7 expects TextEncoder/TextDecoder, which jsdom (Jest 27) doesn't provide.
import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

// Dummy Supabase config so modules that create the client at import time can load in tests.
process.env.REACT_APP_SUPABASE_URL ||= 'http://localhost:54321';
process.env.REACT_APP_SUPABASE_ANON_KEY ||= 'test-anon-key';

// jsdom has no matchMedia; the app uses it for responsive/theme checks.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
