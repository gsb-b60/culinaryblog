type DurationUnit = 'ms' | 's' | 'm' | 'h' | 'd';

const UNIT_MS: Record<DurationUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDuration(input: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${input}"`);
  }
  const value = Number(match[1]);
  const unit = match[2] as DurationUnit;
  return value * UNIT_MS[unit];
}
