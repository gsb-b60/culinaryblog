import { initTracing } from './config-middleware/shared/tracing/index.js';

await initTracing();
await import('./server.js');
