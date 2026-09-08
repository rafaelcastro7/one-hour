import { describe, test, expect } from 'vitest';

const LINKUP_BASE = 'https://api.linkup.so/v1';

describe('Linkup API Contract Tests', () => {
  test('POST /fetch returns alive content and title', async () => {
    const response = await fetch(`${LINKUP_BASE}/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: JSON.stringify({ url: 'https://example.com/test-page' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('alive');
    expect(typeof data.alive).toBe('boolean');
    expect(data).toHaveProperty('title');
    expect(typeof data.title).toBe('string');
    expect(data).toHaveProperty('snippet');
    expect(typeof data.snippet).toBe('string');
    expect(data.snippet.length).toBeLessThanOrEqual(300);
  });

  test('handles non-existent URL gracefully', async () => {
    const response = await fetch(`${LINKUP_BASE}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ url: 'https://this-domain-definitely-does-not-exist-12345.com' }),
    });

    // Should still return 200 with alive: false
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.alive).toBe(false);
  });

  test('POST /search returns answer and sources', async () => {
    const response = await fetch(`${LINKUP_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ q: 'React hydration error fix', depth: 'standard', outputType: 'sourcedAnswer' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('answer');
    expect(typeof data.answer).toBe('string');
    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBe(true);
    if (data.sources.length > 0) {
      expect(data.sources[0]).toHaveProperty('url');
      expect(data.sources[0]).toHaveProperty('name');
    }
  });

  test('search respects depth parameter', async () => {
    const response = await fetch(`${LINKUP_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ q: 'test query', depth: 'standard', outputType: 'sourcedAnswer' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBe(true);
  });

  test('search limits sources to 5', async () => {
    const response = await fetch(`${LINKUP_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ q: 'broad topic query', depth: 'standard', outputType: 'sourcedAnswer' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.sources.length).toBeLessThanOrEqual(5);
  });
});