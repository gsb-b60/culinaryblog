import fs from 'node:fs';
import path from 'node:path';

import { context, isSpanContextValid, trace } from '@opentelemetry/api';
import pino from 'pino';
import { createStream } from 'pino-seq';

import { getRequestContext } from '../shared/requestContext.js';

type TransportTarget = pino.TransportMultiOptions['targets'][number];

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
const logFile = process.env.LOG_FILE;

function bindings(): Record<string, string> {
  const requestContext = getRequestContext();
  const spanContext = trace.getSpan(context.active())?.spanContext();
  const fields: Record<string, string> = {};
  if (spanContext && isSpanContextValid(spanContext)) {
    fields.traceId = spanContext.traceId;
    fields.spanId = spanContext.spanId;
  }
  if (requestContext) {
    fields.correlationId = requestContext.correlationId;
    if (requestContext.userId) fields.userId = requestContext.userId;
  }
  return fields;
}

const targets: TransportTarget[] = [
  process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', level, options: { colorize: true } }
    : { target: 'pino/file', level, options: { destination: 1 } },
];

if (logFile) {
  fs.mkdirSync(path.dirname(path.resolve(logFile)), { recursive: true });
  targets.push({
    target: 'pino-roll',
    level: 'debug',
    options: { file: logFile, frequency: 'daily', size: '50m', mkdir: true, limit: { count: 14 } },
  });
}

const consoleTransport = pino.transport({ targets });
const streams: pino.StreamEntry[] = [{ stream: consoleTransport }];

if (process.env.SEQ_URL) {
  streams.push({
    level: 'debug',
    stream: createStream({
      serverUrl: process.env.SEQ_URL,
      additionalProperties: { service: process.env.OTEL_SERVICE_NAME || 'lethimcook-api' },
      onError: (error) => process.stderr.write(`Seq logging failed: ${String(error)}\n`),
    }),
  });
}

export const logger = pino(
  {
    level,
    base: { service: process.env.OTEL_SERVICE_NAME || 'lethimcook-api' },
    mixin: bindings,
  },
  streams.length === 1 ? consoleTransport : pino.multistream(streams),
);
