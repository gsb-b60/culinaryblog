export class RegisterCommand {
  constructor(
    public readonly fullName: string,
    public readonly email: string,
    public readonly userName: string,
    public readonly password: string,
  ) {}
}
