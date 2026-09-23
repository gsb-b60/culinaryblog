export type CommandMiddleware = (
  command: object,
  next: () => Promise<unknown>,
) => Promise<unknown>;
