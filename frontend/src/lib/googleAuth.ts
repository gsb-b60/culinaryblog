const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface GsiInitializeOptions {
  client_id?: string
  callback: (response: { credential?: string }) => void
  error_callback?: (error: { type?: string; message?: string }) => void
}

interface GsiRenderOptions {
  theme?: string
  size?: string
  text?: string
  shape?: string
  width?: number
}

export interface GsiIdApi {
  initialize: (options: GsiInitializeOptions) => void
  renderButton: (element: HTMLElement, options: GsiRenderOptions) => void
}

interface GsiApi {
  accounts: {
    id: GsiIdApi
  }
}

declare global {
  interface Window {
    google?: GsiApi
  }
}

let loadPromise: Promise<void> | null = null

export function getGoogleClientId(): string | undefined {
  const value = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  return value?.trim() || undefined
}

export function getGsiIdApi(): GsiIdApi | undefined {
  return window.google?.accounts?.id
}

export const GSI_READY_TIMEOUT_MS = 5000
export const GSI_POLL_INTERVAL_MS = 100

/**
 * The GIS script can fire `onload` before `google.accounts.id` is actually
 * usable, and some browsers never expose it at all (Firefox blocks the
 * third-party accounts.google.com iframe). Poll for a bounded time instead of
 * assuming the API is there, and report the difference so the caller can fall
 * back rather than render an empty container.
 */
export async function waitForGsiIdApi(
  timeoutMs: number = GSI_READY_TIMEOUT_MS,
  intervalMs: number = GSI_POLL_INTERVAL_MS,
): Promise<GsiIdApi | null> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const api = getGsiIdApi()
    if (api) return api
    if (Date.now() >= deadline) return null
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

export function loadGoogleScript(): Promise<void> {
  if (getGsiIdApi()) {
    return Promise.resolve()
  }
  if (loadPromise) {
    return loadPromise
  }
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GSI_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Không thể tải Google Identity Services'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}
