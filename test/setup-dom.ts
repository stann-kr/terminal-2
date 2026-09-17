import '@testing-library/jest-dom/vitest';

// jsdom has no viewport scrolling; GSAP refresh may restore the scroll position.
window.scrollTo = () => {};

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    media: query,
    matches: query.includes('prefers-reduced-motion'),
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true,
  }),
});
