import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, deleteRecipe, getManagedRecipes } from '../lib/api'
import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'

const accountA = {
  accessToken: 'access-A',
  refreshToken: 'refresh-A',
  expiresAt: '2099-01-01',
  user: {
    id: 'account-a',
    email: 'a@example.invalid',
    fullName: 'A',
    userName: 'a',
    roles: ['AUTHOR'],
  },
}
const accountB = {
  ...accountA,
  accessToken: 'access-B',
  refreshToken: 'refresh-B',
  user: { ...accountA.user, id: 'account-b', roles: ['ADMIN'] },
}
const rotatedA = { ...accountA, accessToken: 'rotated-A', refreshToken: 'rotated-refresh-A' }
const fetchMock = vi.fn()
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
beforeEach(() => {
  fetchMock.mockReset()
  clearSession()
  vi.stubGlobal('fetch', fetchMock)
  saveSession(accountA)
})
afterEach(() => vi.unstubAllGlobals())

describe('protected request session boundaries', () => {
  it.each([401, 204])(
    'discards an old response after switching accounts (HTTP %s)',
    async (status) => {
      const response = deferred<Response>()
      fetchMock.mockReturnValueOnce(response.promise)
      const outcome = deleteRecipe(accountA.accessToken, 'recipe-a').catch(
        (reason: unknown) => reason,
      )
      saveSession(accountB)
      response.resolve(
        status === 204 ? new Response(null, { status }) : json({ detail: 'Expired A' }, status),
      )
      expect(await outcome).toMatchObject({ name: 'AbortError' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(loadSession()).toEqual(accountB)
    },
  )

  it.each([200, 401, 503])(
    'does not replace or clear B when an old refresh finishes (HTTP %s)',
    async (status) => {
      const pending = deferred<Response>()
      fetchMock.mockResolvedValueOnce(json({}, 401)).mockReturnValueOnce(pending.promise)
      const outcome = deleteRecipe(accountA.accessToken, 'recipe-a').catch(
        (reason: unknown) => reason,
      )
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
      saveSession(accountB)
      pending.resolve(json(status === 200 ? rotatedA : { detail: 'Refresh failed' }, status))
      expect(await outcome).toMatchObject({ name: 'AbortError' })
      expect(loadSession()).toEqual(accountB)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    },
  )

  it('does not restore a session after logout during refresh', async () => {
    const pending = deferred<Response>()
    fetchMock.mockResolvedValueOnce(json({}, 401)).mockReturnValueOnce(pending.promise)
    const outcome = deleteRecipe(accountA.accessToken, 'recipe-a').catch(
      (reason: unknown) => reason,
    )
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    clearSession()
    pending.resolve(json(rotatedA))
    expect(await outcome).toMatchObject({ name: 'AbortError' })
    expect(loadSession()).toBeNull()
  })

  it('does not confuse signing in again to the same account with token rotation', async () => {
    const pending = deferred<Response>()
    fetchMock.mockReturnValueOnce(pending.promise)
    const outcome = deleteRecipe(accountA.accessToken, 'recipe-a').catch(
      (reason: unknown) => reason,
    )
    clearSession()
    saveSession(accountA)
    pending.resolve(json({}, 401))
    expect(await outcome).toMatchObject({ name: 'AbortError' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(loadSession()).toEqual(accountA)
  })
})

describe('shared token rotation', () => {
  it('refreshes once for concurrent requests and retries both with A credentials', async () => {
    const pending = deferred<Response>()
    const sent: string[] = []
    let refreshes = 0
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes++
        return pending.promise
      }
      const authorization = (init.headers as Record<string, string>).Authorization
      sent.push(authorization)
      if (authorization === 'Bearer access-A') return json({}, 401)
      return init.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ items: [] })
    })
    const all = Promise.all([
      getManagedRecipes(accountA.accessToken),
      deleteRecipe(accountA.accessToken, 'recipe-a'),
    ])
    await vi.waitFor(() => expect(refreshes).toBe(1))
    expect(sent).toHaveLength(2)
    expect(refreshes).toBe(1)
    pending.resolve(json(rotatedA))
    await all
    expect(refreshes).toBe(1)
    expect(sent).toEqual([
      'Bearer access-A',
      'Bearer access-A',
      'Bearer rotated-A',
      'Bearer rotated-A',
    ])
    expect(loadSession()).toEqual(rotatedA)
  })

  it('reuses an already rotated token when another old 401 arrives late', async () => {
    const late = deferred<Response>()
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(json(rotatedA))
      .mockResolvedValueOnce(json({ items: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const first = getManagedRecipes(accountA.accessToken)
    const second = deleteRecipe(accountA.accessToken, 'recipe-a')
    await first
    late.resolve(json({}, 401))
    await second
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1)
    expect(loadSession()).toEqual(rotatedA)
  })

  it('shares a failed rotation without retrying the revoked refresh token', async () => {
    const pending = deferred<Response>()
    let refreshes = 0
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes++
        return pending.promise
      }
      return json({}, 401)
    })
    const first = getManagedRecipes(accountA.accessToken).catch((reason: unknown) => reason)
    const second = deleteRecipe(accountA.accessToken, 'recipe-a').catch((reason: unknown) => reason)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    pending.resolve(json({}, 401))
    expect(await first).toBeInstanceOf(ApiError)
    expect(await second).toBeInstanceOf(ApiError)
    expect(refreshes).toBe(1)
    expect(loadSession()).toBeNull()
  })

  it('keeps the session on a temporary refresh service failure and permits retry', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 503))
    await expect(deleteRecipe(accountA.accessToken, 'recipe-a')).rejects.toMatchObject({
      status: 503,
    })
    expect(loadSession()).toEqual(accountA)
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json(rotatedA))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(deleteRecipe(accountA.accessToken, 'recipe-a')).resolves.toBeNull()
  })

  it('preserves the non-remembered session during automatic refresh', async () => {
    saveSession(accountA, false)
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json(rotatedA))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    await deleteRecipe(accountA.accessToken, 'recipe-a')
    expect(localStorage.getItem('culinary_session')).toBeNull()
    expect(JSON.parse(sessionStorage.getItem('culinary_session')!)).toEqual(rotatedA)
  })

  it('does not sign out after a business error from a retried deletion', async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json(rotatedA))
      .mockResolvedValueOnce(json({}, 403))
    await expect(deleteRecipe(accountA.accessToken, 'recipe-a')).rejects.toMatchObject({
      status: 403,
    })
    expect(loadSession()).toEqual(rotatedA)
  })

  it('does not refresh a cancelled list request', async () => {
    const pending = deferred<Response>()
    const controller = new AbortController()
    fetchMock.mockReturnValueOnce(pending.promise)
    const outcome = getManagedRecipes(accountA.accessToken, 1, controller.signal).catch(
      (reason: unknown) => reason,
    )
    controller.abort()
    pending.resolve(json({}, 401))
    expect(await outcome).toMatchObject({ name: 'AbortError' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(loadSession()).toEqual(accountA)
  })
})
