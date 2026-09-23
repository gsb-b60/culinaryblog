import type { ZodType } from 'zod';

import { ValidationError } from '../../../config-middleware/shared/errors/AppError.js';
import type { CommandMiddleware } from '../types.js';

export function createValidationMiddleware(
  validators: Map<string, ZodType>,
): CommandMiddleware {
  return async (command, next) => {
    const commandName = command.constructor?.name ?? '';
    const schema = validators.get(commandName);
    if (!schema) {
      return next();
    }

    const result = schema.safeParse(command);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.length > 0 ? issue.path.join('.') : '_';
        const messages = errors[field] ?? [];
        messages.push(issue.message);
        errors[field] = messages;
      }
      throw new ValidationError(errors);
    }

    Object.assign(command, result.data);
    return next();
  };
}
