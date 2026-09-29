import type { AuthResponse } from '../types/auth'

/**
 * Decodes the base64url session fragment produced by
 * GET /api/v1/auth/google/callback. Returns null on anything malformed so a
 * tampered or truncated fragment can never yield a half-built session.
 */
export function decodeSessionFragment(hash: string): AuthResponse | null {
  const raw = hash.replace(/^#/, '').trim()
  if (!raw) {
    return null
  }

  let json: string
  try {
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    json = new TextDecoder().decode(bytes)
  } catch {
    return null
  }

  try {
    const parsed = JSON.parse(json) as Partial<AuthResponse>
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    if (typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null
    }
    if (!parsed.user || typeof parsed.user !== 'object') {
      return null
    }
    return parsed as AuthResponse
  } catch {
    return null
  }
}
