import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { RegisterCommand } from '../src/application/commands/auth/RegisterCommand.js';
import { registerCommandSchema } from '../src/application/commands/auth/RegisterCommandValidator.js';
import { CommandBus } from '../src/application/shared/commandBus.js';
import { ValidationError } from '../src/config-middleware/shared/errors/AppError.js';

const silentLogger = pino({ level: 'silent' });

describe('CommandBus', () => {
  it('runs the pipeline and returns the handler result', async () => {
    const bus = new CommandBus({ logger: silentLogger });
    const handler = vi.fn(async () => ({ ok: true }));
    bus.register(RegisterCommand, handler, registerCommandSchema);

    const result = await bus.dispatch<{ ok: boolean }>(
      new RegisterCommand('An', 'an@example.com', 'nguyenvana', 'Secret1!'),
    );

    expect(result).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('throws ValidationError (422) with per-field errors when validation fails (A3)', async () => {
    const bus = new CommandBus({ logger: silentLogger });
    const handler = vi.fn(async () => ({}));
    bus.register(RegisterCommand, handler, registerCommandSchema);

    const error = await bus
      .dispatch(
        new RegisterCommand('', 'bad-email', 'a!', 'weak'),
      )
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    const validationError = error as ValidationError;
    expect(validationError.statusCode).toBe(422);
    expect(Object.keys(validationError.errors ?? {})).toEqual(
      expect.arrayContaining(['fullName', 'email', 'userName', 'password']),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('throws 500 when no handler is registered for the command', async () => {
    const bus = new CommandBus({ logger: silentLogger });
    await expect(bus.dispatch(new RegisterCommand('a', 'b', 'c', 'd'))).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('supports additional pipeline middleware', async () => {
    const bus = new CommandBus({ logger: silentLogger });
    const order: string[] = [];
    bus.use(async (_command, next) => {
      order.push('custom');
      return next();
    });
    bus.register(
      RegisterCommand,
      async () => {
        order.push('handler');
        return {};
      },
      z.object({}),
    );

    await bus.dispatch(new RegisterCommand('a', 'b', 'c', 'd'));
    expect(order).toEqual(['custom', 'handler']);
  });
});
