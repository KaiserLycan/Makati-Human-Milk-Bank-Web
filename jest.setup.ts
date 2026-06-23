import '@testing-library/jest-dom';
import {jest} from '@jest/globals';

// Mock next/navigation globally
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));
