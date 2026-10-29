import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

import { useAuthStore } from '../store/auth-store'

// The auth store outlives single tests inside a file, and tests drive sessions
// through raw storage, so reset both sides before every test.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No API fixture configured')))
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ session: null })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})
