import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import { commandBus } from '../../application/command-bus.js';
import { IEmailService } from '../../application/interfaces/IEmailService.js';
import { IFileStorageService } from '../../application/interfaces/IFileStorageService.js';
import { IJwtService } from '../../application/interfaces/IJwtService.js';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { JwtService } from '../../infrastructure/auth/JwtService.js';
import { CategoryRepository } from '../../infrastructure/persistence/repositories/CategoryRepository.js';
import { RecipeRepository } from '../../infrastructure/persistence/repositories/RecipeRepository.js';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import { MinioFileStorageService } from '../../infrastructure/file-storage/MinioFileStorageService.js';
import { NodemailerEmailService } from '../../infrastructure/email/NodemailerEmailService.js';
import { cacheService } from '../../infrastructure/cache/RedisCacheService.js';
import { healthCheckService } from '../../infrastructure/health/HealthCheckService.js';

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

export function containerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  (req as any).container = getContainer();
  next();
}