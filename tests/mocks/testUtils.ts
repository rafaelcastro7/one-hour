import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './handlers';

// Global MSW server setup for all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());