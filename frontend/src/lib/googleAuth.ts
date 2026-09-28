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

interface GsiApi {
  id: {
    initialize: (options: GsiInitializeOptions) => void
    renderButton: (element: HTMLElement, options: GsiRenderOptions) => void
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

export function loadGoogleScript(): Promise<void> {
  if (window.google?.id) {
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
