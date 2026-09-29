import { Query } from '../../command-bus.js';

export class GetCurrentUserQuery extends Query<import('../../dtos/UserDto.js').UserDto> {
  readonly type = 'GetCurrentUserQuery';

  constructor(public readonly userId: string) {
    super();
  }
}