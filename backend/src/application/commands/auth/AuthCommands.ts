import { Command } from '../../command-bus.js';
import { RegisterInput, LoginInput, RefreshTokenInput, GoogleAuthInput } from '../../dtos/UserDto.js';

export class RegisterCommand extends Command<string> {
  readonly type = 'RegisterCommand';

  constructor(public readonly input: RegisterInput) {
    super();
  }
}

export class LoginCommand extends Command<import('../../dtos/UserDto.js').AuthTokensDto> {
  readonly type = 'LoginCommand';

  constructor(public readonly input: LoginInput) {
    super();
  }
}

export class RefreshTokenCommand extends Command<import('../../dtos/UserDto.js').AuthTokensDto> {
  readonly type = 'RefreshTokenCommand';

  constructor(public readonly input: RefreshTokenInput) {
    super();
  }
}

export class GoogleAuthCommand extends Command<import('../../dtos/UserDto.js').AuthTokensDto> {
  readonly type = 'GoogleAuthCommand';

  constructor(public readonly input: GoogleAuthInput) {
    super();
  }
}

export class LogoutCommand extends Command<void> {
  readonly type = 'LogoutCommand';

  constructor(public readonly refreshToken: string) {
    super();
  }
}