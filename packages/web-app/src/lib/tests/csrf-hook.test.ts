/**
 * Test coverage: hook-level CSRF origin check, including the OIDC back-channel logout exemption.
 */
import { describe, expect, it, vi } from 'vitest';
import { handle } from '../../hooks.server';

const ORIGIN = 'https://app-stage.geo.ca';

async function runHandle(path: string, init: RequestInit) {
  const request = new Request(`${ORIGIN}${path}`, init);
  const resolve = vi.fn(async () => new Response('resolved', { status: 200 }));
  const event = { request, url: new URL(request.url), params: {} } as unknown as Parameters<typeof handle>[0]['event'];
  const response = await handle({ event, resolve });
  return { response, resolve };
}

describe('hooks.server CSRF check', () => {
  it('allows a form POST without Origin to the back-channel logout route', async () => {
    const { response, resolve } = await runHandle('/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'logout_token=abc',
    });

    expect(resolve).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });

  it('rejects a cross-site form POST to other routes', async () => {
    const { response, resolve } = await runHandle('/en-ca/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' },
      body: 'a=1',
    });

    expect(resolve).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('rejects a form POST without Origin to other routes', async () => {
    const { response, resolve } = await runHandle('/en-ca/profile', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=x' },
      body: '--x--',
    });

    expect(resolve).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('allows a same-origin form POST', async () => {
    const { response, resolve } = await runHandle('/en-ca/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
      body: 'a=1',
    });

    expect(resolve).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });

  it('does not apply to JSON POSTs', async () => {
    const { resolve } = await runHandle('/api/favourites', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: '{}',
    });

    expect(resolve).toHaveBeenCalledOnce();
  });
});
