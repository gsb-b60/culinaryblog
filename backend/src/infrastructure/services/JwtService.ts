import jwt, { type SignOptions } from 'jsonwebtoken';

import type {
  AccessTokenPayload,
  SignedAccessToken,
} from '../../application/commands/auth/RegisterCommandHandler.js';
import { parseDuration } from '../utils/duration.js';

export class JwtService {
  constructor(
    private readonly accessSecret: string,
    private readonly accessExpiresIn: string,
  ) {}

  signAccessToken(payload: AccessTokenPayload): SignedAccessToken {
    const token = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as SignOptions['expiresIn'],
    });
    const expiresAt = new Date(Date.now() + parseDuration(this.accessExpiresIn));
    return { token, expiresAt };
  }
}
