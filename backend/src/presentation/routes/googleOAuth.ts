import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { commandBus } from '../../application/command-bus.js';
import { GoogleAuthCommand } from '../../application/commands/auth/AuthCommands.js';
import type { AuthResponseDto } from '../../application/dtos/UserDto.js';
import { env } from '../../config-middleware/config/env.js';

import {
  createGoogleOAuthRouter,
  type GoogleOAuthStateClaims,
} from './googleOAuthRoutes.js';

const STATE_TTL = '10m';

function firstCorsOrigin(): string {
  return env.CORS_ORIGINS.split(',')[0]?.trim() || 'http://localhost:5173';
}

function frontendUrl(): string {
  const configured = env.GOOGLE_POST_LOGIN_REDIRECT?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return firstCorsOrigin();
}

function callbackUrl(): string {
  const configured = env.GOOGLE_CALLBACK_URL?.trim();
  if (configured) {
    return configured;
  }
  const port = env.PORT ?? 5000;
  return `http://localhost:${port}/api/v1/auth/google/callback`;
}

/**
 * Wires the OAuth 2.0 redirect flow to the real Google client and the
 * existing GoogleAuthCommandHandler, so account linking and token issuance
 * are not duplicated.
 */
export function googleOAuthRoutes() {
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  const frontend = frontendUrl();

  return createGoogleOAuthRouter({
    googleClientId: env.GOOGLE_CLIENT_ID,
    callbackUrl: callbackUrl(),
    postLoginRedirect: `${frontend}/auth/callback`,
    postLoginErrorRedirect: `${frontend}/auth/login`,
    exchangeCodeForIdToken: async (code: string) => {
      const { tokens } = await client.getToken(code);
      if (!tokens.id_token) {
        throw new Error('Google did not return an id_token');
      }
      return tokens.id_token;
    },
    authenticateWithGoogle: async (idToken: string): Promise<AuthResponseDto> =>
      commandBus.executeCommand(new GoogleAuthCommand({ idToken })),
    signState: (payload: GoogleOAuthStateClaims) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: STATE_TTL }),
    verifyState: (state: string) => {
      try {
        return jwt.verify(state, env.JWT_ACCESS_SECRET) as GoogleOAuthStateClaims;
      } catch {
        return null;
      }
    },
  });
}
