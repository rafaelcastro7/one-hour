import { setupServer } from 'msw/node';
import { allHandlers, errorHandlers } from './handlers';

// Production-like server (all successful responses)
export const server = setupServer(...allHandlers);

// Error scenario server
export const errorServer = setupServer(...allHandlers, ...errorHandlers);

// Helper to start/stop servers in tests
export function setupMockServer(handlers = allHandlers) {
  const server = setupServer(...handlers);
  return {
    start: () => server.listen({ onUnhandledRequest: 'error' }),
    stop: () => server.close(),
    reset: () => server.resetHandlers(),
    use: (...h: Parameters<typeof server.use>) => server.use(...h),
  };
}

// Fixture generators for consistent test data
export const fixtures = {
  nebius: {
    chatCompletion: (overrides = {}) => ({
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              category: 'tech',
              summary: 'Test summary',
              urgency: 'medium',
              language: 'en',
              expectedMinutes: 60,
            }),
            tool_calls: null,
          },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      ...overrides,
    }),

    embedding: (overrides = {}) => ({
      object: 'list',
      data: [{ object: 'embedding', embedding: Array(1024).fill(0.1), index: 0 }],
      model: 'Qwen/Qwen3-Embedding-8B',
      usage: { prompt_tokens: 10, total_tokens: 10 },
      ...overrides,
    }),

    dailyRoom: (overrides = {}) => ({
      url: 'https://test.daily.co/test-room-123',
      name: 'test-room-123',
      config: { expire_time: Math.floor(Date.now() / 1000) + 7200 },
      ...overrides,
    }),

    linkupFetch: (overrides = {}) => ({
      markdown: '# Test Content\n\nThis is test content from Linkup.',
      title: 'Test Page Title',
      ...overrides,
    }),

    linkupSearch: (overrides = {}) => ({
      answer: 'Test search answer for the query.',
      sources: [
        { url: 'https://example.com/source1', name: 'Test Source 1' },
        { url: 'https://example.com/source2', name: 'Test Source 2' },
      ],
      ...overrides,
    }),
  },
};