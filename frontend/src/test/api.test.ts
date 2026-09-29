import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, login, register } from '../lib/api'

const AUTH_RESPONSE = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-09-28T19:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Nguyen Van A',
    email: 'an@example.com',
    userName: 'nguyenvana',
    roles: ['AUTHOR'],
  },
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('login', () => {
  it('POSTs the credentials to /auth/login and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(AUTH_RESPONSE))

    const result = await login({ email: 'an@example.com', password: 'Secret1!' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/auth/login')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'an@example.com',
      password: 'Secret1!',
    })
    expect(result).toEqual(AUTH_RESPONSE)
  })

  it('throws ApiError carrying the RFC 7807 problem on 401', async () => {
    const problem = {
      type: 'AUTH_INVALID_CREDENTIALS',
      title: 'Unauthorized',
      status: 401,
      detail: 'Email or password is incorrect',
    }
    fetchMock.mockResolvedValue(jsonResponse(problem, 401))

    const error = await login({ email: 'an@example.com', password: 'nope' }).catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(401)
    expect(apiError.message).toBe('Email or password is incorrect')
    expect(apiError.problem).toEqual(problem)
  })

  it('surfaces the 403 account-locked problem type', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { type: 'AUTH_ACCOUNT_LOCKED', title: 'Forbidden', status: 403, detail: 'Too many attempts' },
        403,
      ),
    )

    const error = (await login({ email: 'an@example.com', password: 'x' }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error.status).toBe(403)
    expect(error.problem?.type).toBe('AUTH_ACCOUNT_LOCKED')
  })

  it('maps per-field 422 errors onto the problem details', async () => {
    const problem = {
      type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
      title: 'Validation Error',
      status: 422,
      detail: 'Request validation failed',
      errors: { email: ['Invalid email address'] },
    }
    fetchMock.mockResolvedValue(jsonResponse(problem, 422))

    const error = (await login({ email: 'bad', password: '' }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error.status).toBe(422)
    expect(error.problem?.errors?.email).toEqual(['Invalid email address'])
  })

  it('reports status 0 with a friendly message when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = (await login({ email: 'an@example.com', password: 'x' }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.problem).toBeNull()
    expect(error.message).toMatch(/không thể kết nối/i)
  })

  it('falls back to a generic detail when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('upstream exploded', { status: 502 }))

    const error = (await login({ email: 'an@example.com', password: 'x' }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error.status).toBe(502)
    expect(error.message).toContain('502')
  })
})

describe('register', () => {
  it('still posts to /auth/register', async () => {
    fetchMock.mockResolvedValue(jsonResponse(AUTH_RESPONSE, 201))

    await register({
      fullName: 'Nguyen Van A',
      email: 'an@example.com',
      userName: 'nguyenvana',
      password: 'Secret1!',
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/auth/register')
    expect(init.method).toBe('POST')
  })
})
