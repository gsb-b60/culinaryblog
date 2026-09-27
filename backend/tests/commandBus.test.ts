import { describe, expect, it, vi } from 'vitest';

import {
  Command,
  CommandBus,
  ICommandHandler,
  IValidator,
} from '../src/application/command-bus.js';

class FirstCommand extends Command<string> {
  readonly type = 'FirstCommand';

  constructor(public readonly value: string) {
    super();
  }
}

class SecondCommand extends Command<string> {
  readonly type = 'SecondCommand';

  constructor(public readonly value: string) {
    super();
  }
}

class RejectedCommand extends Command<void> {
  readonly type = 'RejectedCommand';
}

class QueriedCommand extends Command<string> {
  readonly type = 'QueriedCommand';
}

describe('CommandBus', () => {
  it('dispatches a command to its registered handler', async () => {
    const bus = new CommandBus();
    const handler: ICommandHandler<FirstCommand, string> = {
      execute: vi.fn(async (command) => `handled:${command.value}`),
    };
    bus.registerCommandHandler(FirstCommand.name, handler);

    const result = await bus.executeCommand(new FirstCommand('hello'));

    expect(result).toBe('handled:hello');
    expect(handler.execute).toHaveBeenCalledOnce();
  });

  it('throws when no handler is registered for a command', async () => {
    const bus = new CommandBus();

    await expect(bus.executeCommand(new FirstCommand('orphan'))).rejects.toThrow(
      /No handler registered for command/,
    );
  });

  it('runs the registered validator before the handler', async () => {
    const bus = new CommandBus();
    const order: string[] = [];
    const validator: IValidator<SecondCommand> = {
      validate: vi.fn(async () => {
        order.push('validate');
      }),
    };
    const handler: ICommandHandler<SecondCommand, string> = {
      execute: async () => {
        order.push('execute');
        return 'ok';
      },
    };
    bus.registerCommandHandler(SecondCommand.name, handler);
    bus.registerValidator(SecondCommand.name, validator);

    const result = await bus.executeCommand(new SecondCommand('payload'));

    expect(result).toBe('ok');
    expect(order).toEqual(['validate', 'execute']);
  });

  it('rejects when the validator fails and never runs the handler', async () => {
    const bus = new CommandBus();
    const handler = { execute: vi.fn(async () => 'never') };
    const validator: IValidator<SecondCommand> = {
      validate: vi.fn(async () => {
        throw new Error('invalid payload');
      }),
    };
    bus.registerCommandHandler(SecondCommand.name, handler);
    bus.registerValidator(SecondCommand.name, validator);

    await expect(bus.executeCommand(new SecondCommand('bad'))).rejects.toThrow('invalid payload');
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it('runs middlewares in registration order around the handler', async () => {
    const bus = new CommandBus();
    const order: string[] = [];
    bus.use(async (_command, next) => {
      order.push('middleware-1');
      return next();
    });
    bus.use(async (_command, next) => {
      order.push('middleware-2');
      return next();
    });
    bus.registerCommandHandler(RejectedCommand.name, {
      execute: async () => {
        order.push('handler');
      },
    });

    await bus.executeCommand(new RejectedCommand());

    expect(order).toEqual(['middleware-1', 'middleware-2', 'handler']);
  });

  it('throws when no query handler is registered', async () => {
    const bus = new CommandBus();

    await expect(bus.executeQuery(new QueriedCommand())).rejects.toThrow(
      /No handler registered for query/,
    );
  });
});
