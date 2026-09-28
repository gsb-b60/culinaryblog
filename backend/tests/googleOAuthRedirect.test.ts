import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthResponseDto } from '../src/application/dtos/UserDto.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import { createGoogleOAuthRouter } from '../src/presentation/routes/googleOAuthRoutes.js';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const CALLBACK_URL = 'http://localhost:5000/api/v1/auth/google/callback';
const FRONTEND = 'http://localhost:5173';
const SECRET = 'test-access-secret-min-32-chars-xxxxxxxx';

const AUTH_RESPONSE: AuthResponseDto = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-09-28T19:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Nguyen Van A',
    email: 'an@example.com',
    userName: 'nguyenvana',
    roles: ['AUTHOR'],
  },
};

function decodeFragment(fragment: string): AuthResponseDto {
  const json = Buffer.from(fragment, 'base64url').toString('utf8');
  return JSON.parse(json) as AuthResponseDto;
}

function buildApp(overrides: Partial<Parameters<typeof createGoogleOAuthRouter>[0]> = {}) {
  const deps = {
    googleClientId: CLIENT_ID,
    callbackUrl: CALLBACK_URL,
    postLoginRedirect: `${FRONTEND}/auth/callback`,
    postLoginErrorRedirect: `${FRONTEND}/auth/login`,
    exchangeCodeForIdToken: vi.fn().mockResolvedValue('google-id-token'),
    authenticateWithGoogle: vi.fn().mockResolvedValue(AUTH_RESPONSE),
    signState: (payload: object) => jwt.sign(payload, SECRET, { expiresIn: '10m' }),
    verifyState: (state: string) => {
      try {
        return jwt.verify(state, SECRET) as { purpose?: string; nonce?: string };
      } catch {
        return null;
      }
    },
    ...overrides,
  };
  const app = express();
  app.use('/api/v1/auth', createGoogleOAuthRouter(deps));
  app.use(globalErrorHandler);
  return { app, deps };
}

describe('GET /api/v1/auth/google/redirect', () => {
  it('302s to the Google authorization endpoint with the right parameters', async () => {
    const { app } = buildApp();

    const res = await request(app).get('/api/v1/auth/google/redirect');

    expect(res.status).toBe(302);
    const location = new URL(res.headers.location as string);
    expect(`${location.origin}${location.pathname}`).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(location.searchParams.get('client_id')).toBe(CLIENT_ID);
    expect(location.searchParams.get('redirect_uri')).toBe(CALLBACK_URL);
    expect(location.searchParams.get('response_type')).toBe('code');
    expect(location.searchParams.get('scope')).toBe('openid email profile');
    expect(location.searchParams.get('state')).toEqual(expect.any(String));
  });

  it('signs a single-use state that can be verified later', async () => {
    const { app } = buildApp();

    const res = await request(app).get('/api/v1/auth/google/redirect');
    const state = new URL(res.headers.location as string).searchParams.get('state') as string;

    const claims = jwt.verify(state, SECRET) as Record<string, unknown>;
    expect(claims).toMatchObject({ purpose: 'google-oauth-state' });
    expect(claims.nonce).toEqual(expect.any(String));
  });

  it('issues a different nonce on every redirect', async () => {
    const { app } = buildApp();

    const first = await request(app).get('/api/v1/auth/google/redirect');
    const second = await request(app).get('/api/v1/auth/google/redirect');
    const nonce = (u: string) => new URL(u).searchParams.get('state');

    expect(nonce(first.headers.location as string)).not.toBe(
      nonce(second.headers.location as string),
    );
  });

  it('returns 503 when Google login is not configured', async () => {
    const { app } = buildApp({ googleClientId: undefined });

    const res = await request(app).get('/api/v1/auth/google/redirect');

    expect(res.status).toBe(503);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_GOOGLE_NOT_CONFIGURED',
      status: 503,
    });
  });
});

describe('GET /api/v1/auth/google/callback', () => {
  async function freshState(app: express.Express): Promise<string> {
    const res = await request(app).get('/api/v1/auth/google/redirect');
    return new URL(res.headers.location as string).searchParams.get('state') as string;
  }

  it('exchanges the code and redirects to the frontend with the session', async () => {
    const { app, deps } = buildApp();
    const state = await freshState(app);

    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: 'auth-code', state });

    expect(res.status).toBe(302);
    expect(deps.exchangeCodeForIdToken).toHaveBeenCalledWith('auth-code');
    expect(deps.authenticateWithGoogle).toHaveBeenCalledWith('google-id-token');

    const location = new URL(res.headers.location as string);
    expect(`${location.origin}${location.pathname}`).toBe(`${FRONTEND}/auth/callback`);
    expect(location.hash).not.toBe('');
    const payload = decodeFragment(location.hash.slice(1));
    expect(payload).toEqual(AUTH_RESPONSE);
  });

  it('returns 400 when the state is missing', async () => {
    const { app, deps } = buildApp();

    const res = await request(app).get('/api/v1/auth/google/callback').query({ code: 'c' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ type: 'AUTH_GOOGLE_INVALID_STATE', status: 400 });
    expect(deps.exchangeCodeForIdToken).not.toHaveBeenCalled();
  });

  it('returns 400 when the state was not signed by us', async () => {
    const { app, deps } = buildApp();

    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: 'c', state: 'forged-state' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ type: 'AUTH_GOOGLE_INVALID_STATE' });
    expect(deps.exchangeCodeForIdToken).not.toHaveBeenCalled();
  });

  it('returns 400 when the state carries the wrong purpose', async () => {
    const { app } = buildApp();

    const state = jwt.sign({ purpose: 'something-else' }, SECRET, { expiresIn: '10m' });
    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: 'c', state });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the code exchange fails', async () => {
    const { app, deps } = buildApp();
    deps.exchangeCodeForIdToken.mockRejectedValue(new Error('invalid_grant'));
    const state = await freshState(app);

    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: 'bad-code', state });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ type: 'AUTH_GOOGLE_CODE_EXCHANGE_FAILED', status: 400 });
  });

  it('redirects back to the frontend with an error when the profile is rejected', async () => {
    const { app, deps } = buildApp();
    deps.authenticateWithGoogle.mockRejectedValue(
      Object.assign(new Error('Invalid or expired Google token'), {
        statusCode: 401,
        code: 'AUTH_GOOGLE_INVALID_TOKEN',
      }),
    );
    const state = await freshState(app);

    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: 'auth-code', state });

    expect(res.status).toBe(302);
    const location = new URL(res.headers.location as string);
    expect(`${location.origin}${location.pathname}`).toBe(`${FRONTEND}/auth/login`);
    expect(location.searchParams.get('error')).toBe('AUTH_GOOGLE_INVALID_TOKEN');
    expect(location.hash).toBe('');
  });

  it('surfaces the error Google reported when it bounces straight to the callback', async () => {
    const { app, deps } = buildApp();
    const state = await freshState(app);

    const res = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ state, error: 'access_denied' });

    expect(res.status).toBe(302);
    expect(deps.exchangeCodeForIdToken).not.toHaveBeenCalled();
    const location = new URL(res.headers.location as string);
    expect(location.searchParams.get('error')).toBe('GOOGLE_AUTH_DENIED');
  });
});
