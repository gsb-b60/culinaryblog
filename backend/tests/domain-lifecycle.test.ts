import { describe, expect, it } from 'vitest';

import { Category } from '../src/domain/entities/Category.js';
import { Recipe } from '../src/domain/entities/Recipe.js';
import { RecipeImage } from '../src/domain/entities/RecipeImage.js';
import { RecipeIngredient } from '../src/domain/entities/RecipeIngredient.js';
import { RecipeStep } from '../src/domain/entities/RecipeStep.js';
import { User } from '../src/domain/entities/User.js';
import { RecipeDifficulty } from '../src/domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../src/domain/enums/RecipeStatus.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { EmailAddress } from '../src/domain/value-objects/EmailAddress.js';
import { Slug } from '../src/domain/value-objects/Slug.js';

// Domain tests use real entities and values; no mocks or external dependencies.
function publicSnapshot(entity: object, persisted: object) {
  return Object.fromEntries(Object.keys(persisted).map((key) => [key, Reflect.get(entity, key)]));
}

describe('Domain lifecycle and persistence round trips', () => {
  it('creates a draft recipe, publishes once, archives and restores it to draft', () => {
    const recipe = Recipe.create({
      title: 'Canh rau ngon',
      description: 'Vegetable soup',
      instructions: 'Boil',
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      difficulty: RecipeDifficulty.EASY,
      categoryId: 'category',
      authorId: 'author',
      nutrition: { calories: 120 },
    });
    expect(recipe.status).toBe(RecipeStatus.DRAFT);
    expect(recipe.totalTime).toBe(30);
    expect(recipe.canPublish()).toBe(true);
    expect(recipe.slug.getValue()).toBe('canh-rau-ngon');
    recipe.publish();
    expect(recipe.status).toBe(RecipeStatus.PUBLISHED);
    expect(recipe.publishedAt).toBeInstanceOf(Date);
    const publishedVersion = recipe.version;
    recipe.publish();
    expect(recipe.version).toBe(publishedVersion);
    recipe.archive();
    expect(() => recipe.publish()).toThrow('Recipe cannot be published');
    recipe.unpublish();
    expect(recipe.publishedAt).toBeUndefined();
    const draftVersion = recipe.version;
    recipe.unpublish();
    expect(recipe.version).toBe(draftVersion);
    recipe.update({ servings: 4 });
    recipe.softDelete();
    expect(recipe.servings).toBe(4);
    expect(recipe.isDeleted).toBe(true);
    const record = recipe.toPersistence();
    expect(publicSnapshot(Recipe.reconstruct(record), record)).toEqual(record);
    record.title = 'Detached record';
    expect(recipe.title).toBe('Canh rau ngon');
  });
  it('updates category metadata while preserving its identity and slug', () => {
    const category = Category.create({
      name: 'Mon ngon',
      description: 'Meals',
      imageUrl: 'https://example.com/a.png',
      orderIndex: 1,
    });
    const id = category.id;
    category.update({ name: 'Mon moi', orderIndex: 3 });
    expect(category.id).toBe(id);
    expect(category.slug.getValue()).toBe('mon-ngon');
    category.softDelete();
    expect(category.version).toBe(3);
    const record = category.toPersistence();
    expect(publicSnapshot(Category.reconstruct(record), record)).toEqual(record);
  });
  it('records failed access, resets the counter, and persists profile changes', () => {
    const user = User.create({
      email: ' AUTHOR@Example.com ',
      displayName: 'Author',
      passwordHash: 'hash',
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Cook',
      googleId: 'google-id',
    });
    expect(user.role).toBe(UserRole.AUTHOR);
    expect(user.email.getValue()).toBe('author@example.com');
    expect(user.emailVerified).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    user.setPasswordHash('new-hash');
    user.verifyEmail();
    user.updateProfile({ displayName: 'Chef', bio: 'New bio' });
    for (let i = 0; i < 5; i++) user.recordFailedAccess();
    expect(user.isActive).toBe(true);
    const locked = User.reconstruct({
      ...user.toPersistence(),
      lockoutEnabled: true,
      accessFailedCount: 4,
    });
    locked.recordFailedAccess();
    expect(locked.isActive).toBe(false);
    user.resetAccessFailedCount();
    user.softDelete();
    expect(user.accessFailedCount).toBe(0);
    expect(user.isDeleted).toBe(true);
    const record = user.toPersistence();
    expect(publicSnapshot(User.reconstruct(record), record)).toEqual(record);
  });
  it('updates and soft deletes recipe ingredients without losing recipe ownership', () => {
    const item = RecipeIngredient.create({
      recipeId: 'recipe',
      name: 'Rice',
      quantity: 2,
      unit: 'cups',
      notes: 'Washed',
      orderIndex: 0,
    });
    item.update({ quantity: 3, orderIndex: 2 });
    item.softDelete();
    expect(item.recipeId).toBe('recipe');
    expect(item.quantity).toBe(3);
    expect(item.isDeleted).toBe(true);
    const record = item.toPersistence();
    expect(publicSnapshot(RecipeIngredient.reconstruct(record), record)).toEqual(record);
  });
  it('keeps a zero step timer and versions step changes', () => {
    const item = RecipeStep.create({
      recipeId: 'recipe',
      stepNumber: 1,
      title: 'Wash',
      description: 'Wash rice',
      timerMinutes: 0,
      imageUrl: 'https://example.com/step.png',
    });
    item.update({ description: 'Wash twice', stepNumber: 2 });
    item.softDelete();
    expect(item.timerMinutes).toBe(0);
    expect(item.version).toBe(3);
    const record = item.toPersistence();
    expect(publicSnapshot(RecipeStep.reconstruct(record), record)).toEqual(record);
  });
  it('sets and unsets a primary image and preserves generated sizes', () => {
    const item = RecipeImage.create({
      recipeId: 'recipe',
      originalUrl: 'https://example.com/a.png',
      mediumUrl: 'https://example.com/m.png',
      thumbnailUrl: 'https://example.com/t.png',
      altText: 'Soup',
      isPrimary: false,
      orderIndex: 0,
    });
    item.setAsPrimary();
    expect(item.isPrimary).toBe(true);
    item.unsetPrimary();
    item.update({ altText: 'Fresh soup' });
    item.softDelete();
    expect(item.isPrimary).toBe(false);
    expect(item.version).toBe(5);
    const record = item.toPersistence();
    expect(publicSnapshot(RecipeImage.reconstruct(record), record)).toEqual(record);
  });
});

describe('Email addresses and recipe slugs', () => {
  it.each(['', ' ', 'missing-at', 'a@invalid', `${'a'.repeat(250)}@example.com`])(
    'rejects invalid email %s',
    (value) => {
      expect(() => EmailAddress.create(value)).toThrow();
    },
  );
  it('normalizes email and compares stored addresses', () => {
    const email = EmailAddress.create(' A@Example.COM ');
    expect(email.equals(EmailAddress.fromExisting('a@example.com'))).toBe(true);
    expect(email.equals(EmailAddress.create('b@example.com'))).toBe(false);
    expect(email.getDomain()).toBe('example.com');
    expect(email.toString()).toBe('a@example.com');
  });
  it('normalizes and compares persisted slugs', () => {
    const slug = Slug.create('  Mon Ngon!  ');
    expect(slug.equals(Slug.fromExisting(' MON-NGON '))).toBe(true);
    expect(slug.equals(Slug.fromExisting('other'))).toBe(false);
    expect(slug.toString()).toBe('mon-ngon');
  });
  it.each(['', ' ', 'a'.repeat(221)])('rejects invalid new slug', (value) => {
    expect(() => Slug.create(value)).toThrow();
  });
  it.each(['', ' '])('rejects empty persisted slug', (value) => {
    expect(() => Slug.fromExisting(value)).toThrow();
  });
});
