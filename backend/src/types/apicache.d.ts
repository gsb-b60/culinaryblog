declare module 'apicache' {
  import { RequestHandler, Request } from 'express';

  interface ApicacheOptions {
    appendKey?: (req: Request, res?: unknown) => string;
  }

  interface Apicache {
    options(options: ApicacheOptions): Apicache;
    middleware(duration: string): RequestHandler;
  }

  const apicache: Apicache;
  export default apicache;
}
