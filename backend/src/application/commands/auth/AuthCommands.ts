import { Command } from '../../command-bus.js';
import {
  AuthResponseDto,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  GoogleAuthInput,
} from '../../dtos/UserDto.js';

export class RegisterCommand extends Command<AuthResponseDto> {
  readonly type = 'RegisterCommand';

  constructor(public readonly input: RegisterInput) {
    super();
  }
}

// Returns the same AuthResponseDto as RegisterCommand/GoogleAuthCommand so
// the client can store one uniform session shape after any login method.
export class LoginCommand extends Command<AuthResponseDto> {
  readonly type = 'LoginCommand';

  constructor(public readonly input: LoginInput) {
    super();
  }
}

export class RefreshTokenCommand extends Command<AuthResponseDto> {
  readonly type = 'RefreshTokenCommand';

  constructor(public readonly input: RefreshTokenInput) {
    super();
  }
}

export class GoogleAuthCommand extends Command<AuthResponseDto> {
  readonly type = 'GoogleAuthCommand';

  constructor(public readonly input: GoogleAuthInput) {
    super();
  }
}

export class LogoutCommand extends Command<void> {
  readonly type = 'LogoutCommand';

  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) {
    super();
  }
}
