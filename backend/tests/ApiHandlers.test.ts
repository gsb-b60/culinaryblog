import { describe, expect, it, vi } from 'vitest';

import { CommandBus } from '../src/application/command-bus.js';
import { registerApiHandlers } from '../src/application/ApiHandlers.js';
import { UpdateProfileCommand } from '../src/application/commands/auth/AuthCommands.js';
import { SearchRecipesQuery } from '../src/application/queries/recipes/RecipeQueries.js';
import { IJwtService } from '../src/application/interfaces/IJwtService.js';
import { ICategoryRepository } from '../src/domain/repositories/ICategoryRepository.js';
import { IRecipeRepository } from '../src/domain/repositories/IRecipeRepository.js';
import { IUserRepository } from '../src/domain/repositories/IUserRepository.js';
import { User } from '../src/domain/entities/User.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { PrismaClient } from '@prisma/client';

describe('API handlers', () => {
  it('persists profile changes and returns the updated user DTO', async () => {
    const user = User.create({ email: 'author@example.com', displayName: 'Before' });
    const userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      save: vi.fn(async (savedUser: User) => savedUser),
    };
    const commandBus = createBus({ userRepository });

    const result = await commandBus.executeCommand(
      new UpdateProfileCommand(user.id, { displayName: 'After', bio: 'Updated bio' }),
    );

    expect(userRepository.save).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      id: user.id,
      email: 'author@example.com',
      displayName: 'After',
      bio: 'Updated bio',
    });
  });

  it('forces guest visibility for public recipe searches', async () => {
    const recipeRepository = {
      search: vi.fn().mockResolvedValue({
        items: [],
        meta: { page: 1, pageSize: 12, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      }),
    };
    const commandBus = createBus({ recipeRepository });

    await commandBus.executeQuery(new SearchRecipesQuery(
      'soup',
      { status: 'DRAFT' as never },
      { field: 'createdAt', order: 'desc' },
      1,
      12,
    ));

    expect(recipeRepository.search).toHaveBeenCalledWith(
      'soup',
      { status: 'DRAFT', visibility: { role: UserRole.GUEST } },
      { field: 'createdAt', order: 'desc' },
      1,
      12,
    );
  });
});

function createBus(overrides: {
  userRepository?: Record<string, unknown>;
  recipeRepository?: Record<string, unknown>;
} = {}): CommandBus {
  const jwtService: IJwtService = {
    generateAccessToken: vi.fn().mockReturnValue('access'),
    generateRefreshToken: vi.fn().mockReturnValue('refresh'),
    verifyAccessToken: vi.fn().mockReturnValue(null),
    verifyRefreshToken: vi.fn().mockReturnValue('token-hash'),
    decodeToken: vi.fn().mockReturnValue(null),
  };
  const userRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByGoogleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    existsByEmail: vi.fn(),
    existsByGoogleId: vi.fn(),
    count: vi.fn(),
    ...overrides.userRepository,
  } as unknown as IUserRepository;
  const categoryRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findMany: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    existsByName: vi.fn(),
    existsBySlug: vi.fn(),
    count: vi.fn(),
  } as unknown as ICategoryRepository;
  const recipeRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findMany: vi.fn(),
    findPublishedByCategory: vi.fn(),
    search: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    existsBySlug: vi.fn(),
    count: vi.fn(),
    ...overrides.recipeRepository,
  } as unknown as IRecipeRepository;
  const prisma = {} as PrismaClient;
  const commandBus = new CommandBus();

  registerApiHandlers(commandBus, prisma, jwtService, userRepository, categoryRepository, recipeRepository);
  return commandBus;
}
