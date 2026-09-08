import { describe, test, expect } from 'vitest';

const DAILY_BASE = 'https://api.daily.co/v1';

describe('Daily.co API Contract Tests', () => {
  test('POST /rooms creates a room and returns URL', async () => {
    const response = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: JSON.stringify({
        name: 'test-room-123',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 7200,
          enable_chat: true,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(typeof data.url).toBe('string');
    expect(data.url).toMatch(/^https:\/\/.*\.daily\.co\//);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('config');
  });

  test('room name is preserved in response', async () => {
    const roomName = `test-room-${Date.now()}`;
    const response = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: JSON.stringify({
        name: roomName,
        properties: { exp: Math.floor(Date.now() / 1000) + 7200, enable_chat: true },
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.name).toBe(roomName);
  });

  test('room expiration is set correctly', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const response = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ name: 'expiry-test', properties: { exp, enable_chat: true } }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.config?.exp).toBeDefined();
  });

  test('chat is enabled by default in our config', async () => {
    const response = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ name: 'chat-test', properties: { enable_chat: true } }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.config?.enable_chat).toBe(true);
  });
});