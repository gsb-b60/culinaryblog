import { describe, expect, it } from 'vitest';

import { registerSchema } from '../src/application/validators/authValidators.js';

const validBody = {
  fullName: 'Nguyen Van A',
  email: 'an@example.com',
  userName: 'nguyenvana',
  password: 'Secret1!',
};

function errorMessages(
  result: { success: false; error: { issues: { path: (string | number)[]; message: string }[] } },
  field: string,
): string[] {
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe('registerSchema', () => {
  it('accepts a valid payload', () => {
    const result = registerSchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });

  it('trims whitespace and lowercases the email', () => {
    const result = registerSchema.safeParse({
      ...validBody,
      email: '  AN@Example.COM  ',
      fullName: '  Nguyen Van A  ',
      userName: '  nguyenvana  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('an@example.com');
      expect(result.data.fullName).toBe('Nguyen Van A');
      expect(result.data.userName).toBe('nguyenvana');
    }
  });

  it('rejects an empty fullName', () => {
    const result = registerSchema.safeParse({ ...validBody, fullName: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'fullName').join(' ')).toMatch(/required/i);
    }
  });

  it('rejects a missing fullName', () => {
    const { fullName: _omitted, ...withoutFullName } = validBody;
    const result = registerSchema.safeParse(withoutFullName);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'fullName')).toBe(true);
    }
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...validBody, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'email')).toBe(true);
    }
  });

  it('rejects a userName containing special characters', () => {
    const result = registerSchema.safeParse({ ...validBody, userName: 'nguyen van a!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'userName').join(' ')).toMatch(
        /letters, numbers and underscores/,
      );
    }
  });

  it('rejects a userName shorter than 3 characters', () => {
    const result = registerSchema.safeParse({ ...validBody, userName: 'ab' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'userName')).toBe(true);
    }
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validBody, password: 'Ab1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'password').join(' ')).toMatch(/at least 8/);
    }
  });

  it('rejects a password without an uppercase letter', () => {
    const result = registerSchema.safeParse({ ...validBody, password: 'abcdef123!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'password').join(' ')).toMatch(/uppercase/);
    }
  });

  it('rejects a password without a digit', () => {
    const result = registerSchema.safeParse({ ...validBody, password: 'Abcdefgh!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'password').join(' ')).toMatch(/number/);
    }
  });

  it('rejects a password without a special character', () => {
    const result = registerSchema.safeParse({ ...validBody, password: 'Abcdef1234' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(errorMessages(result, 'password').join(' ')).toMatch(/special/);
    }
  });

  it('aggregates multiple field errors at once', () => {
    const result = registerSchema.safeParse({
      fullName: '',
      email: 'nope',
      userName: 'x!',
      password: 'shrt',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
      expect(fields).toContain('fullName');
      expect(fields).toContain('email');
      expect(fields).toContain('userName');
      expect(fields).toContain('password');
    }
  });
});
