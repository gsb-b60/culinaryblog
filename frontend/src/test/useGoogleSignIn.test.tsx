import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGoogleSignIn, type GoogleState } from '../hooks/useGoogleSignIn'

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

/** Mirrors how the pages consume the hook, including the ref'd slot. */
function Harness() {
  const { state, buttonRef, retry } = useGoogleSignIn({
    text: 'signin_with',
    onSuccess: () => {},
    onError: () => {},
  })
  return (
    <div>
      <span data-testid="state">{state}</span>
      <button type="button" onClick={retry}>
        retry
      </button>
      {state === 'ready' ? <div data-testid="gsi-slot" ref={buttonRef} /> : null}
    </div>
  )
}

function currentState(): GoogleState {
  return (screen.getByTestId('state').textContent ?? '') as GoogleState
}

beforeEach(() => {
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

  it('renders the Google button into the slot', async () => {
    render(<Harness />)
    await waitFor(() => expect(currentState()).toBe('ready'))

    // renderButton is deferred out of the effect body, so wait for the call.
    await waitFor(() => expect(gsiMock.renderButton).toHaveBeenCalledTimes(1))
    const slot = screen.getByTestId('gsi-slot')
    expect(gsiMock.renderButton.mock.calls[0]?.[0]).toBe(slot)
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
