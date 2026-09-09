import { describe, test, expect, vi } from 'vitest';
import { server } from '../mocks/handlers';
import { http, HttpResponse } from 'msw';
import { fixtures } from '../mocks/fixtures';

const NEBIUS_BASE = 'https://api.tokenfactory.nebius.com/v1';

function expectValidNebiusChatResponse(response: unknown) {
  expect(response).toHaveProperty('choices');
  expect(Array.isArray((response as any).choices)).toBe(true);
  expect((response as any).choices[0]).toHaveProperty('message');
  expect((response as any).choices[0].message).toHaveProperty('content');
}

function expectValidNebiusEmbeddingResponse(response: unknown) {
  expect(response).toHaveProperty('data');
  expect(Array.isArray((response as any).data)).toBe(true);
  expect((response as any).data[0]).toHaveProperty('embedding');
  expect(Array.isArray((response as any).data[0].embedding)).toBe(true);
  expect((response as any).data[0].embedding.length).toBeGreaterThan(0);
}

describe('Nebius API Contract Tests', () => {
  test('chat/completions returns valid structure for closeProfile', async () => {
    const response = await fetch(`${NEBIUS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          { role: 'system', content: 'Analyze this conversation... return JSON with category, summary...' },
          { role: 'user', content: 'User: I need help with React\nAssistant: What kind of React issue?' },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expectValidNebiusChatResponse(data);
  });

  test('chat/completions returns valid structure for decideMatch', async () => {
    const response = await fetch(`${NEBIUS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          { role: 'system', content: 'You are the final decision engine...' },
          { role: 'user', content: 'Need: test\nCandidates: ...' },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('chosenLabel');
    expect(data).toHaveProperty('reasoning');
    expect(typeof data.chosenLabel).toBe('string');
    expect(typeof data.reasoning).toBe('string');
  });

  test('chat/completions returns valid structure for aiHelpStep', async () => {
    const response = await fetch(`${NEBIUS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          { role: 'system', content: 'You are Aria...' },
          { role: 'user', content: 'How do I fix a hydration error?' },
        ],
        temperature: 0.7,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('reply');
    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBe(true);
  });

  test('chat/completions returns valid structure for runIntakeStep', async () => {
    const response = await fetch(`${NEBIUS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          { role: 'system', content: 'You are a brief, warm interviewer...' },
          { role: 'user', content: 'I need help with React hydration' },
        ],
        temperature: 0.7,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('done');
    expect(typeof data.done).toBe('boolean');
  });

  test('embeddings returns valid structure', async () => {
    const response = await fetch(`${NEBIUS_BASE}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-Embedding-8B',
        input: 'Test text to embed',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0]).toHaveProperty('embedding');
    expect(Array.isArray(data.data[0].embedding)).toBe(true);
    expect(data.data[0].embedding.length).toBeGreaterThan(0);
  });

  test('handles rate limit error (429)', async () => {
    server.use(
      http.post(`${NEBIUS_BASE}/chat/completions`, () =>
        HttpResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      )
    );

    const response = await fetch(`${NEBIUS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [{ role: 'user', content: 'Trigger 429' }],
      }),
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Rate limit exceeded',
    });
  });
});
