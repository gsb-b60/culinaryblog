import { mkdir, open, readdir, unlink, type FileHandle } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Writable } from 'node:stream';

import pino from 'pino';

import { env } from './env.js';

class DailyFileStream extends Writable {
  private handle: FileHandle | undefined;

  private activeDay: string | undefined;

  constructor(
    private readonly directory: string,
    private readonly retentionDays: number,
  ) {
    super();
  }

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    void this.writeChunk(chunk).then(
      () => callback(),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error))),
    );
  }

  override _final(callback: (error?: Error | null) => void): void {
    if (!this.handle) {
      callback();
      return;
    }

    void this.handle.close().then(
      () => callback(),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error))),
    );
  }

  private async writeChunk(chunk: Buffer): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    if (day !== this.activeDay || !this.handle) await this.rotate(day);
    await this.handle!.writeFile(chunk);
  }

  private async rotate(day: string): Promise<void> {
    await this.handle?.close();
    await mkdir(this.directory, { recursive: true });
    this.handle = await open(join(this.directory, `backend-${day}.log`), 'a');
    this.activeDay = day;

    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    const files = await readdir(this.directory, { withFileTypes: true });
    await Promise.all(files
      .filter(file => file.isFile() && /^backend-\d{4}-\d{2}-\d{2}\.log$/.test(file.name))
      .filter(file => {
        const fileDate = Date.parse(`${file.name.slice(8, 18)}T00:00:00.000Z`);
        return Number.isFinite(fileDate) && fileDate < cutoff;
      })
      .map(file => unlink(join(this.directory, file.name))));
  }
}

class SeqStream extends Writable {
  private readonly events: Record<string, unknown>[] = [];

  private flushing: Promise<void> | undefined;

  private reportedFailure = false;

  private readonly interval: NodeJS.Timeout;

  constructor(
    private readonly endpoint: URL,
    private readonly apiKey?: string,
  ) {
    super();
    this.interval = setInterval(() => {
      void this.flush();
    }, 1000);
    this.interval.unref();
  }

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    for (const line of chunk.toString().split('\n').filter(Boolean)) {
      try {
        this.events.push(this.toClef(JSON.parse(line) as Record<string, unknown>));
      } catch {
        process.stderr.write('Unable to serialize a log event for Seq.\n');
      }
    }

    if (this.events.length >= 20) void this.flush();
    callback();
  }

  override _final(callback: (error?: Error | null) => void): void {
    clearInterval(this.interval);
    void this.flush().then(
      () => callback(),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error))),
    );
  }

  private toClef(event: Record<string, unknown>): Record<string, unknown> {
    const level = Number(event.level ?? 30);
    const { time, msg, err, ...properties } = event;
    delete properties.level;
    const clef: Record<string, unknown> = {
      '@t': typeof time === 'number' ? new Date(time).toISOString() : new Date().toISOString(),
      '@m': typeof msg === 'string' ? msg : 'Backend log event',
      '@l': level >= 60
        ? 'Fatal'
        : level >= 50
          ? 'Error'
          : level >= 40
            ? 'Warning'
            : level >= 30
              ? 'Information'
              : level >= 20
                ? 'Debug'
                : 'Verbose',
      ...properties,
    };
    if (err && typeof err === 'object' && 'stack' in err) {
      clef['@x'] = (err as { stack?: unknown }).stack;
    }
    return clef;
  }

  private async flush(): Promise<void> {
    if (this.flushing) {
      await this.flushing;
      if (this.events.length > 0) await this.flush();
      return;
    }
    if (this.events.length === 0) return;

    const batch = this.events.splice(0, this.events.length);
    this.flushing = (async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/vnd.serilog.clef',
        };
        if (this.apiKey) headers['X-Seq-ApiKey'] = this.apiKey;
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: batch.map(event => JSON.stringify(event)).join('\n'),
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error(`Seq ingestion returned HTTP ${response.status}`);
        this.reportedFailure = false;
      } catch (error) {
        if (!this.reportedFailure) {
          process.stderr.write(
            `Seq log delivery failed: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          this.reportedFailure = true;
        }
      }
    })();

    await this.flushing;
    this.flushing = undefined;
    if (this.events.length > 0) await this.flush();
  }
}

const fileStream = new DailyFileStream(
  resolve(process.cwd(), env.LOG_DIRECTORY),
  env.LOG_RETENTION_DAYS,
);
fileStream.on('error', error => {
  process.stderr.write(`File log delivery failed: ${error.message}\n`);
});

const streams: pino.StreamEntry[] = [
  { stream: process.stdout },
  { stream: fileStream },
];

if (env.NODE_ENV === 'development' && env.SEQ_URL) {
  const seqEndpoint = new URL(env.SEQ_URL);
  seqEndpoint.pathname = `${seqEndpoint.pathname.replace(/\/$/, '')}/api/events/raw`;
  seqEndpoint.searchParams.set('clef', '');
  const seqStream = new SeqStream(seqEndpoint, env.SEQ_API_KEY);
  seqStream.on('error', error => {
    process.stderr.write(`Seq log stream failed: ${error.message}\n`);
  });
  streams.push({ stream: seqStream });
}

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
      'accessToken',
      'refreshToken',
      'SMTP_PASS',
      '*.SMTP_PASS',
    ],
    censor: '[REDACTED]',
  },
}, pino.multistream(streams));
