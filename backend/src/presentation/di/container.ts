import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

import { commandBus } from '../../application/command-bus.js';
import {
  GoogleAuthCommand,
  LoginCommand,
  LogoutCommand,
  RefreshTokenCommand,
  RegisterCommand,
  UpdateProfileCommand,
} from '../../application/commands/auth/AuthCommands.js';
import {
  AddRecipeIngredientCommand,
  PublishRecipeCommand,
  UnpublishRecipeCommand,
  DeleteRecipeIngredientCommand,
  UpdateRecipeIngredientCommand,
} from '../../application/commands/recipes/RecipeCommands.js';
import {
  GoogleAuthCommandHandler,
  LoginCommandHandler,
  LogoutCommandHandler,
  RefreshTokenCommandHandler,
  RegisterCommandHandler,
  UpdateProfileCommandHandler,
  type GoogleProfile,
} from '../../application/handlers/AuthCommandHandlers.js';
import { GetCurrentUserQueryHandler } from '../../application/handlers/AuthQueryHandlers.js';
import {
  AddRecipeIngredientCommandHandler,
  DeleteRecipeIngredientCommandHandler,
  UpdateRecipeIngredientCommandHandler,
} from '../../application/handlers/RecipeIngredientCommandHandlers.js';
import { PublishRecipeCommandHandler, UnpublishRecipeCommandHandler } from '../../application/handlers/RecipeStatusCommandHandlers.js';
import { ManagedRecipeQueryHandler } from '../../application/handlers/ManagedRecipeQueryHandler.js';
import { GetManagedRecipesQuery } from '../../application/queries/recipes/GetManagedRecipesQuery.js';
import { IEmailService } from '../../application/interfaces/IEmailService.js';
import { IFileStorageService } from '../../application/interfaces/IFileStorageService.js';
import { IJwtService } from '../../application/interfaces/IJwtService.js';
import { env } from '../../config-middleware/config/env.js';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { JwtService } from '../../infrastructure/auth/JwtService.js';
import { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import { cacheService } from '../../infrastructure/cache/RedisCacheService.js';
import { NodemailerEmailService } from '../../infrastructure/email/NodemailerEmailService.js';
import { MinioFileStorageService } from '../../infrastructure/file-storage/MinioFileStorageService.js';
import { healthCheckService } from '../../infrastructure/health/HealthCheckService.js';
import { addWelcomeEmailJob } from '../../infrastructure/jobs/queues/welcomeEmailQueue.js';
import { CategoryRepository } from '../../infrastructure/persistence/repositories/CategoryRepository.js';
import { RecipeRepository } from '../../infrastructure/persistence/repositories/RecipeRepository.js';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import { parseDuration } from '../../infrastructure/utils/duration.js';

export interface Container {
  prisma: PrismaClient;
  recipeRepository: IRecipeRepository;
  categoryRepository: ICategoryRepository;
  userRepository: IUserRepository;
  jwtService: IJwtService;
  fileStorageService: IFileStorageService;
  emailService: IEmailService;
  cacheService: typeof cacheService;
  healthCheckService: typeof healthCheckService;
  commandBus: typeof commandBus;
}

let container: Container | null = null;

export function createContainer(): Container {
  if (container) return container;

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  const recipeRepository = new RecipeRepository(prisma);
  const categoryRepository = new CategoryRepository(prisma);
  const userRepository = new UserRepository(prisma);
  const jwtService = new JwtService();
  const fileStorageService = new MinioFileStorageService();
  const emailService = new NodemailerEmailService();

  commandBus.registerCommandHandler(
    AddRecipeIngredientCommand.name,
    new AddRecipeIngredientCommandHandler(prisma),
  );
  commandBus.registerCommandHandler(
    UpdateRecipeIngredientCommand.name,
    new UpdateRecipeIngredientCommandHandler(prisma),
  );
  commandBus.registerCommandHandler(
    DeleteRecipeIngredientCommand.name,
    new DeleteRecipeIngredientCommandHandler(prisma),
  );

  commandBus.registerCommandHandler(
    PublishRecipeCommand.name,
    new PublishRecipeCommandHandler(prisma, cacheService),
  );
  commandBus.registerCommandHandler(
    UnpublishRecipeCommand.name,
    new UnpublishRecipeCommandHandler(prisma, cacheService),
  );

  commandBus.registerQueryHandler(
    GetManagedRecipesQuery.name,
    new ManagedRecipeQueryHandler(prisma),
  );

  commandBus.registerQueryHandler(
    'GetCurrentUserQuery',
    new GetCurrentUserQueryHandler(prisma),
  );

  commandBus.registerCommandHandler(
    UpdateProfileCommand.name,
    new UpdateProfileCommandHandler(prisma),
  );

  commandBus.registerCommandHandler(
    RegisterCommand.name,
    new RegisterCommandHandler({
      prisma,
      jwtService,
      hashPassword: (password: string) => bcrypt.hash(password, 12),
      enqueueWelcomeEmail: addWelcomeEmailJob,
      accessTokenTtlMs: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      refreshTokenTtlMs: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
    }),
  );

  commandBus.registerCommandHandler(
    LoginCommand.name,
    new LoginCommandHandler({
      prisma,
      jwtService,
      // Handles both argon2id and bcrypt hashes, so it verifies accounts
      // created by registration (bcrypt) and any future rehash.
      verifyPassword: (password: string, hash: string) => PasswordService.verify(password, hash),
      accessTokenTtlMs: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      refreshTokenTtlMs: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
    }),
  );

  commandBus.registerCommandHandler(
    RefreshTokenCommand.name,
    new RefreshTokenCommandHandler({
      prisma,
      jwtService,
      accessTokenTtlMs: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      refreshTokenTtlMs: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
    }),
  );

  commandBus.registerCommandHandler(
    LogoutCommand.name,
    new LogoutCommandHandler({ prisma }),
  );

  const googleAuthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  commandBus.registerCommandHandler(
    GoogleAuthCommand.name,
    new GoogleAuthCommandHandler({
      prisma,
      jwtService,
      googleClientId: env.GOOGLE_CLIENT_ID,
      verifyGoogleToken: async (idToken: string): Promise<GoogleProfile> => {
        const ticket = await googleAuthClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return {
          sub: payload?.sub ?? '',
          email: payload?.email ?? '',
          emailVerified: payload?.email_verified === true,
          name: payload?.name,
          picture: payload?.picture,
        };
      },
      enqueueWelcomeEmail: addWelcomeEmailJob,
      accessTokenTtlMs: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      refreshTokenTtlMs: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
    }),
  );

  container = {
    prisma,
    recipeRepository,
    categoryRepository,
    userRepository,
    jwtService,
    fileStorageService,
    emailService,
    cacheService,
    healthCheckService,
    commandBus,
  };

  return container;
}

export function getContainer(): Container {
  if (!container) {
    return createContainer();
  }
  return container;
}

export async function destroyContainer(): Promise<void> {
  if (container) {
    await container.prisma.$disconnect();
    await cacheService.disconnect();
    container = null;
  }
}

export function containerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as any).container = getContainer();
  next();
}
