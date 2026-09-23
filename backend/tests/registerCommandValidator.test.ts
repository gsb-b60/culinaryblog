import { describe, expect, it } from 'vitest';

import { registerCommandSchema } from '../src/application/commands/auth/RegisterCommandValidator.js';

const validInput = {
  fullName: 'Nguyen Van A',
  email: 'an@example.com',
  userName: 'nguyenvana',
  password: 'Secret1!',
};

function passwordErrors(password: string): string[] {
  const result = registerCommandSchema.safeParse({ ...validInput, password });
  expect(result.success).toBe(false);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === 'password')
    .map((issue) => issue.message);
}

describe('registerCommandSchema', () => {
  it('accepts a valid payload', () => {
    const result = registerCommandSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('trims and lowercases fields', () => {
    const result = registerCommandSchema.safeParse({
      fullName: '  Nguyen Van A  ',
      email: '  An@Example.COM ',
      userName: '  nguyenvana ',
      password: 'Secret1!',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      fullName: 'Nguyen Van A',
      email: 'an@example.com',
      userName: 'nguyenvana',
      password: 'Secret1!',
    });
  });

  it('rejects empty fullName', () => {
    const result = registerCommandSchema.safeParse({ ...validInput, fullName: '   ' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'fullName')).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = registerCommandSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'email')).toBe(true);
  });

  it('rejects userName with special characters', () => {
    const result = registerCommandSchema.safeParse({ ...validInput, userName: 'nguyen van!' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'userName')).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const messages = passwordErrors('Ab1!');
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((m) => m.includes('at least 8'))).toBe(true);
  });

  it('rejects password without an uppercase letter', () => {
    const messages = passwordErrors('secret1!');
    expect(messages.some((m) => m.includes('uppercase'))).toBe(true);
  });

  it('rejects password without a digit', () => {
    const messages = passwordErrors('Secret!!');
    expect(messages.some((m) => m.includes('digit'))).toBe(true);
  });

  it('rejects password without a special character', () => {
    const messages = passwordErrors('Secret12');
    expect(messages.some((m) => m.includes('special'))).toBe(true);
  });

  it('collects multiple field errors at once', () => {
    const result = registerCommandSchema.safeParse({
      fullName: '',
      email: 'bad',
      userName: 'a',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fields = new Set(result.error.issues.map((i) => i.path[0]));
    expect(fields).toEqual(new Set(['fullName', 'email', 'userName', 'password']));
  });
});
