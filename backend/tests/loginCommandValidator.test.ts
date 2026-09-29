import { describe, expect, it } from 'vitest';

import { loginSchema } from '../src/application/validators/authValidators.js';

const validBody = {
  email: 'an@example.com',
  password: 'Secret1!',
};

function fieldsOf(result: {
  success: false;
  error: { issues: { path: (string | number)[]; message: string }[] };
}): Set<unknown> {
  return new Set(result.error.issues.map((issue) => issue.path[0]));
}

describe('loginSchema', () => {
  it('accepts a valid payload', () => {
    const result = loginSchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });

  it('trims whitespace and lowercases the email so logins match the stored address', () => {
    const result = loginSchema.safeParse({ ...validBody, email: '  AN@Example.COM  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('an@example.com');
    }
  });

  it('does not apply registration password complexity rules', () => {
    // Login only proves the password is non-empty; strength is a register-time rule.
    const result = loginSchema.safeParse({ email: 'an@example.com', password: 'a' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ ...validBody, password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldsOf(result)).toContain('password');
    }
  });

  it('does not trim the password, so passwords with meaningful spaces still match', () => {
    // Trimming here would silently break any account whose password has
    // leading or trailing whitespace. An all-whitespace password is simply
    // rejected later by the 401 credential check.
    const result = loginSchema.safeParse({ ...validBody, password: '  secret  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.password).toBe('  secret  ');
    }
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ ...validBody, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldsOf(result)).toContain('email');
    }
  });

  it('rejects a missing email', () => {
    const { email: _omitted, ...withoutEmail } = validBody;
    const result = loginSchema.safeParse(withoutEmail);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldsOf(result)).toContain('email');
    }
  });

  it('rejects a missing password', () => {
    const { password: _omitted, ...withoutPassword } = validBody;
    const result = loginSchema.safeParse(withoutPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldsOf(result)).toContain('password');
    }
  });

  it('aggregates both field errors when the body is empty', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldsOf(result)).toEqual(new Set(['email', 'password']));
    }
  });
});
