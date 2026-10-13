import { z } from 'zod';

// HTTP query values are strings; repeated/structured/blank values are invalid.
// PostgreSQL recipe durations and servings use signed 32-bit integer columns.
export const queryIntegerSchema = z.union([
  z.number(),
  z.string().trim().regex(/^\d+$/).transform(Number),
]).pipe(z.number().int().nonnegative().max(2147483647));
