import { RegisterCommand } from './application/commands/auth/RegisterCommand.js';
import { RegisterCommandHandler } from './application/commands/auth/RegisterCommandHandler.js';
import { registerCommandSchema } from './application/commands/auth/RegisterCommandValidator.js';
import { CommandBus } from './application/shared/commandBus.js';
import { env } from './config-middleware/config/env.js';
import { prisma } from './config-middleware/shared/database/client.js';
import { enqueueWelcomeEmail } from './infrastructure/queue/welcomeEmailQueue.js';
import { JwtService } from './infrastructure/services/JwtService.js';
import { hashPassword } from './infrastructure/services/passwordService.js';
import { generateRefreshToken, hashToken } from './infrastructure/services/tokenService.js';
import { parseDuration } from './infrastructure/utils/duration.js';

export function createCommandBus(): CommandBus {
  const jwt = new JwtService(env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);

  const registerHandler = new RegisterCommandHandler({
    prisma,
    hashPassword,
    signAccessToken: (payload) => jwt.signAccessToken(payload),
    generateRefreshToken,
    hashToken,
    enqueueWelcomeEmail,
    refreshTokenTtlMs: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
  });

  const bus = new CommandBus();
  bus.register(
    RegisterCommand,
    (command) => registerHandler.execute(command),
    registerCommandSchema,
  );
  return bus;
}
