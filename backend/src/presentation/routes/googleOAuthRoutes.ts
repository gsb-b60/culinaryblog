import { randomBytes } from 'crypto';

import { Router, type Router as RouterType } from 'express';

import type { AuthResponseDto } from '../../application/dtos/UserDto.js';
import { logger } from '../../config-middleware/config/logger.js';
import { AppError } from '../../config-middleware/shared/errors/AppError.js';

/**
 * OAuth 2.0 Authorization Code flow, used as the fallback for browsers where
 * the Google Identity Services button cannot render (notably Firefox, which
 * blocks the third-party accounts.google.com iframe). This flow is what
 * FR-AUTH-003 specifies.
 */
const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_SCOPE = 'openid email profile';
const STATE_PURPOSE = 'google-oauth-state';

export interface GoogleOAuthStateClaims {
  purpose?: string;
  nonce?: string;
}

export interface GoogleOAuthRouterDeps {
  googleClientId: string | undefined;
  callbackUrl: string;
  /** Success target, e.g. FRONTEND/auth/callback — the session rides in the fragment. */
  postLoginRedirect: string;
  /** Failure target, e.g. FRONTEND/auth/login?error=... */
  postLoginErrorRedirect: string;
  exchangeCodeForIdToken: (code: string) => Promise<string>;
  authenticateWithGoogle: (idToken: string) => Promise<AuthResponseDto>;
  signState: (payload: GoogleOAuthStateClaims) => string;
  /** Returns null when the state is unsigned, tampered with, or expired. */
  verifyState: (state: string) => GoogleOAuthStateClaims | null;
}

function problemError(status: number, code: string, message: string, title: string): AppError {
  return new AppError(status, message, code, { type: code, title });
}

/**
 * The session travels in the URL fragment. Browsers never send a fragment to a
 * server and never put it in a Referer header, so the tokens cannot leak to a
 * third party the way query parameters would.
 */
function encodeSession(auth: AuthResponseDto): string {
  return Buffer.from(JSON.stringify(auth), 'utf8').toString('base64url');
}

function errorRedirect(base: string, code: string, status?: number): string {
  const url = new URL(base);
  url.searchParams.set('error', code);
  if (status) {
    url.searchParams.set('status', String(status));
  }
  return url.toString();
}

export function createGoogleOAuthRouter(deps: GoogleOAuthRouterDeps): RouterType {
  const router: RouterType = Router();

  router.get('/google/redirect', (_req, res) => {
    if (!deps.googleClientId) {
      throw problemError(
        503,
        'AUTH_GOOGLE_NOT_CONFIGURED',
        'Google login is not configured',
        'Service Unavailable',
      );
    }

    const state = deps.signState({
      purpose: STATE_PURPOSE,
      nonce: randomBytes(16).toString('hex'),
    });

    const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
    url.searchParams.set('client_id', deps.googleClientId);
    url.searchParams.set('redirect_uri', deps.callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', GOOGLE_SCOPE);
    url.searchParams.set('state', state);
    // Consent screen hint only; it has no effect on security.
    url.searchParams.set('prompt', 'select_account');

    res.redirect(302, url.toString());
  });

  router.get('/google/callback', async (req, res, next) => {
    try {
      const { code, state, error } = req.query as Record<string, string | undefined>;

      // Google reports a declined consent screen as a redirect carrying error.
      if (error) {
        res.redirect(302, errorRedirect(deps.postLoginErrorRedirect, 'GOOGLE_AUTH_DENIED'));
        return;
      }

      if (!state) {
        throw problemError(400, 'AUTH_GOOGLE_INVALID_STATE', 'Missing OAuth state', 'Bad Request');
      }
      const claims = deps.verifyState(state);
      if (!claims || claims.purpose !== STATE_PURPOSE) {
        throw problemError(400, 'AUTH_GOOGLE_INVALID_STATE', 'Invalid OAuth state', 'Bad Request');
      }

      if (!code) {
        throw problemError(400, 'AUTH_GOOGLE_MISSING_CODE', 'Missing OAuth code', 'Bad Request');
      }

      let idToken: string;
      try {
        idToken = await deps.exchangeCodeForIdToken(code);
      } catch {
        throw problemError(
          400,
          'AUTH_GOOGLE_CODE_EXCHANGE_FAILED',
          'Could not exchange the authorization code',
          'Bad Request',
        );
      }

      let auth: AuthResponseDto;
      try {
        // Reuse the existing Google handler so account linking and token
        // issuance stay in one place.
        auth = await deps.authenticateWithGoogle(idToken);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        const failureCode = (err as { code?: string }).code ?? 'AUTH_GOOGLE_FAILED';
        // This handler catches its own errors, so nothing reaches the global
        // error handler. Without this the user is bounced to the login page and
        // the actual cause is logged nowhere.
        logger.error(
          { err, code: failureCode, status: statusCode },
          'Google OAuth callback failed',
        );
        res.redirect(302, errorRedirect(deps.postLoginErrorRedirect, failureCode, statusCode));
        return;
      }

      res.redirect(302, `${deps.postLoginRedirect}#${encodeSession(auth)}`);
    } catch (err) {
      // Express 4 does not forward rejections from async handlers on its own.
      next(err);
    }
  });

  return router;
}
