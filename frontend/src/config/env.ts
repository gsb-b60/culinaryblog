import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('http://localhost:5000/api/v1'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
})

export const env = envSchema.parse(import.meta.env)

export type FrontendEnv = z.infer<typeof envSchema>
