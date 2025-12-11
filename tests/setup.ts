import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock fetch for search suggestions
global.fetch = vi.fn();

// Mock Image for background color calculation
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin: string = '';
  private _src: string = '';

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    // Simulate async image load
    setTimeout(() => {
      if (this.onerror) this.onerror();
    }, 0);
  }
}

Object.defineProperty(window, 'Image', {
  value: MockImage,
});

// Mock canvas context for image processing
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100 * 100 * 4),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mockdata'),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  mockLocation.href = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});
