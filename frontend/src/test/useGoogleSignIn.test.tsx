import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GOOGLE_HINTS,
  GSI_BUTTON_WIDTH,
  resetGoogleSignIn,
  useGoogleSignIn,
  type GoogleState,
} from '../hooks/useGoogleSignIn'

const gsiMock = {
  initialize: vi.fn(),
  renderButton: vi.fn(),
}

const waitForGsiIdApiMock = vi.fn()
const loadGoogleScriptMock = vi.fn()

vi.mock('../lib/googleAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/googleAuth')>()
  return {
    ...actual,
    getGoogleClientId: () => 'test-client-id.apps.googleusercontent.com',
    getGsiIdApi: () => gsiMock,
    loadGoogleScript: (...args: unknown[]) => loadGoogleScriptMock(...args),
    waitForGsiIdApi: (...args: unknown[]) => waitForGsiIdApiMock(...args),
  }
})

/** Mirrors how the pages consume the hook, including the always-mounted slot. */
function Harness({ onReset }: { onReset?: (reset: () => void) => void }) {
  const { state, gisRendered, buttonRef, retry, reset } = useGoogleSignIn({
    text: 'signin_with',
    onSuccess: () => {},
    onError: () => {},
  })
  onReset?.(reset)
  return (
    <div>
      <span data-testid="state">{state}</span>
      <span data-testid="rendered">{String(gisRendered)}</span>
      <button type="button" onClick={retry}>
        retry
      </button>
      <button type="button" onClick={reset}>
        reset
      </button>
      <div data-testid="gsi-slot" ref={buttonRef} />
    </div>
  )
}

function currentState(): GoogleState {
  return (screen.getByTestId('state').textContent ?? '') as GoogleState
}

beforeEach(() => {
  // The initialize guard is module scoped by design, so each test starts clean.
  resetGoogleSignIn()
  gsiMock.initialize.mockReset()
  gsiMock.renderButton.mockReset()
  waitForGsiIdApiMock.mockReset()
  loadGoogleScriptMock.mockReset()
  loadGoogleScriptMock.mockResolvedValue(undefined)
  waitForGsiIdApiMock.mockResolvedValue(gsiMock)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useGoogleSignIn', () => {
  it('reaches ready and initializes GIS with the configured client id', async () => {
    render(<Harness />)

    await waitFor(() => expect(currentState()).toBe('ready'))
    expect(gsiMock.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'test-client-id.apps.googleusercontent.com' }),
    )
  })

  it('renders the Google button into the slot and reports it as rendered', async () => {
    // Simulate Google injecting its node, which is what the watchdog watches for.
    gsiMock.renderButton.mockImplementation((element: HTMLElement) => {
      element.appendChild(document.createElement('div'))
    })
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))

    // renderButton is deferred out of the effect body, so wait for the call.
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalledTimes(1))
    const slot = screen.getByTestId('gsi-slot')
    expect(gsiMock.renderButton.mock.calls[0]?.[0]).toBe(slot)
    await waitFor(() => expect(screen.getByTestId('rendered').textContent).toBe('true'))
  })

  it('requests a capped width so the injected button stays centred', async () => {
    render(<Harness />)
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalled())

    // The slot is wider than the button, so passing the container width would
    // stretch the button across the whole card.
    const options = gsiMock.renderButton.mock.calls[0]?.[1] as { width?: number }
    expect(options.width).toBeLessThanOrEqual(GSI_BUTTON_WIDTH)
  })

  it('keeps the slot mounted so the ref is never null', async () => {
    waitForGsiIdApiMock.mockResolvedValue(null)
    render(<Harness />)

    // Present before Google is even loaded, so no state can null the ref.
    expect(screen.getByTestId('gsi-slot')).toBeInTheDocument()
    await waitFor(() => expect(currentState()).toBe('unavailable'))
    expect(screen.getByTestId('gsi-slot')).toBeInTheDocument()
  })

  it('initializes GIS only once even when effects run twice', async () => {
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))

    expect(gsiMock.initialize).toHaveBeenCalledTimes(1)
  })

  it('does not re-initialize when a second page mounts the hook', async () => {
    // /auth/login -> /auth/register creates a brand new hook instance. The
    // guard is module scoped precisely so this does not warn again.
    const first = render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))
    first.unmount()

    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))

    expect(gsiMock.initialize).toHaveBeenCalledTimes(1)
  })

  it('rebuilds the button after reset, so a second sign-in gets a fresh one', async () => {
    gsiMock.renderButton.mockImplementation((element: HTMLElement) => {
      element.appendChild(document.createElement('div'))
    })
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByRole('button', { name: 'reset' }))

    // A fresh button, not the one holding the already-consumed credential.
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalledTimes(2))
    // Reset clears the module guard too, so Google is genuinely re-initialised
    // rather than reusing an instance that already spent a credential.
    expect(gsiMock.initialize).toHaveBeenCalledTimes(2)
  })

  it('does not stack duplicate buttons across double effect runs', async () => {
    gsiMock.renderButton.mockImplementation((element: HTMLElement) => {
      element.appendChild(document.createElement('div'))
    })
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalled())

    expect(screen.getByTestId('gsi-slot').childElementCount).toBe(1)
  })

  it('falls back to unavailable when renderButton produces no DOM', async () => {
    // Firefox: renderButton returns normally but inserts nothing at all.
    gsiMock.renderButton.mockImplementation(() => {})
    render(<Harness />)

    await waitFor(() => expect(currentState()).toBe('unavailable'), { timeout: 4000 })
    expect(screen.getByTestId('rendered').textContent).toBe('false')
  })

  it('reports unavailable when google.accounts.id never appears', async () => {
    // This is the Firefox case: the script loads but the API is never usable.
    waitForGsiIdApiMock.mockResolvedValue(null)
    render(<Harness />)

    await waitFor(() => expect(currentState()).toBe('unavailable'))
    expect(gsiMock.initialize).not.toHaveBeenCalled()
    expect(gsiMock.renderButton).not.toHaveBeenCalled()
  })

  it('falls back to unavailable when renderButton throws', async () => {
    gsiMock.renderButton.mockImplementation(() => {
      throw new Error('blocked by tracking protection')
    })
    render(<Harness />)

    await waitFor(() => expect(currentState()).toBe('unavailable'))
  })

  it('reports failed when the script itself never loads', async () => {
    loadGoogleScriptMock.mockRejectedValue(new Error('network down'))
    render(<Harness />)

    await waitFor(() => expect(currentState()).toBe('failed'))
  })

  it('recovers on retry after an unavailable api', async () => {
    waitForGsiIdApiMock.mockResolvedValue(null)
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('unavailable'))
    const callsBefore = loadGoogleScriptMock.mock.calls.length

    waitForGsiIdApiMock.mockResolvedValue(gsiMock)
    await userEvent.click(screen.getByRole('button', { name: 'retry' }))

    await waitFor(() => expect(currentState()).toBe('ready'))
    expect(loadGoogleScriptMock.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})

describe('GOOGLE_HINTS', () => {
  it('sends the user to email and password when the button is unavailable', () => {
    // There is no second Google control, so the status line is the only thing
    // that explains the button did not work.
    expect(GOOGLE_HINTS.unavailable).toMatch(/email và mật khẩu/)
  })

  it('never points at another Google button', () => {
    for (const hint of Object.values(GOOGLE_HINTS)) {
      expect(hint).not.toMatch(/nút bên dưới/i)
    }
  })

  it('shows no hint once the button is ready', () => {
    expect(GOOGLE_HINTS.ready).toBe('')
  })
})
