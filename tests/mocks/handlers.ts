import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';

export const NEBIUS_BASE = 'https://api.tokenfactory.nebius.com/v1';
export const DAILY_BASE = 'https://api.daily.co/v1';
export const LINKUP_BASE = 'https://api.linkup.so/v1';

// Type definitions for request bodies
interface NebiusChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: string };
}

interface DailyRoomRequest {
  name: string;
  properties?: {
    exp?: number;
    enable_chat?: boolean;
  };
}

interface LinkupFetchRequest {
  url: string;
}

interface LinkupSearchRequest {
  q: string;
  depth?: string;
  outputType?: string;
}

// ============================================================================
// NEBIUS MOCKS
// ============================================================================

export const nebiusChatCompletionsHandler = http.post(
  `${NEBIUS_BASE}/chat/completions`,
  async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as NebiusChatRequest;
    const messages = body.messages ?? [];

    // Detect which action based on system prompt content
    const systemPrompt = messages.find(m => m.role === 'system')?.content ?? '';
    const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

    // closeProfile action - returns structured JSON wrapped in chat completion format
    if (systemPrompt.includes('Analyze this conversation') && systemPrompt.includes('JSON')) {
      const isOffer = systemPrompt.includes('offers volunteer help');
      return HttpResponse.json({
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
                category: isOffer ? 'tech' : 'languages',
                summary: 'Test summary for ' + (isOffer ? 'offer' : 'need'),
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
      });
    }

    // decideMatch action
    if (systemPrompt.includes('final decision engine')) {
      return HttpResponse.json({
        chosenLabel: 'C1',
        reasoning: 'Test reasoning for match decision',
      });
    }

    // aiHelpStep action
    if (systemPrompt.includes('You are Aria')) {
      return HttpResponse.json({
        reply: 'Test Aria response in English.',
        sources: [{ url: 'https://example.com/source', name: 'Test Source' }],
      });
    }

    // runIntakeStep action - returns direct response (not wrapped in chat completion)
    if (systemPrompt.includes('interviewer')) {
      return HttpResponse.json({
        message: 'Test intake question',
        done: false,
        refused: null,
      });
    }

    // Default fallback
    return HttpResponse.json({
      choices: [{ message: { content: 'Default test response' } }],
    });
  },
);

export const nebiusEmbeddingsHandler = http.post(
  `${NEBIUS_BASE}/embeddings`,
  async ({ request }) => {
    await delay(50);
    return HttpResponse.json({
      data: [{ embedding: Array(1024).fill(0.1) }],
    });
  },
);

// ============================================================================
// DAILY.CO MOCKS
// ============================================================================

export const dailyCreateRoomHandler = http.post(
  `${DAILY_BASE}/rooms`,
  async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as DailyRoomRequest;
    const exp = body.properties?.exp ?? Math.floor(Date.now() / 1000) + 7200;
    const enableChat = body.properties?.enable_chat ?? true;
    return HttpResponse.json({
      url: `https://test.daily.co/${body.name}`,
      name: body.name,
      config: { exp, enable_chat: enableChat },
    });
  },
);

// ============================================================================
// LINKUP MOCKS
// ============================================================================

export const linkupFetchHandler = http.post(
  `${LINKUP_BASE}/fetch`,
  async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as LinkupFetchRequest;
    const url = body.url;
    if (url && url.includes('does-not-exist')) {
      return HttpResponse.json({
        alive: false,
        title: null,
        snippet: '',
      });
    }
    return HttpResponse.json({
      alive: true,
      title: 'Test Page Title',
      snippet: 'Test content snippet from Linkup.',
    });
  },
);

export const linkupSearchHandler = http.post(
  `${LINKUP_BASE}/search`,
  async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as LinkupSearchRequest;
    return HttpResponse.json({
      answer: 'Test search answer for the query.',
      sources: [
        { url: 'https://example.com/source1', name: 'Test Source 1' },
        { url: 'https://example.com/source2', name: 'Test Source 2' },
      ],
    });
  },
);

// ============================================================================
// ALL HANDLERS EXPORT
// ============================================================================

export const allHandlers = [
  nebiusChatCompletionsHandler,
  nebiusEmbeddingsHandler,
  dailyCreateRoomHandler,
  linkupFetchHandler,
  linkupSearchHandler,
];

// ============================================================================
// ERROR HANDLERS (for testing error paths)
// ============================================================================

export const nebiusErrorHandler = http.post(
  `${NEBIUS_BASE}/chat/completions`,
  () => HttpResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
);

export const dailyErrorHandler = http.post(
  `${DAILY_BASE}/rooms`,
  () => HttpResponse.json({ error: 'Invalid API key' }, { status: 401 }),
);

export const linkupErrorHandler = http.post(
  `${LINKUP_BASE}/search`,
  () => HttpResponse.json({ error: 'Invalid API key' }, { status: 401 }),
);

export const errorHandlers = [nebiusErrorHandler, dailyErrorHandler, linkupErrorHandler];

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

export const server = setupServer(...allHandlers);

export function setupMockServer(handlers = allHandlers) {
  const server = setupServer(...handlers);
  return {
    start: () => server.listen({ onUnhandledRequest: 'error' }),
    stop: () => server.close(),
    reset: () => server.resetHandlers(),
    use: (...h: Parameters<typeof server.use>) => server.use(...h),
  };
}