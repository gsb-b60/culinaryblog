import { afterEach, describe, expect, it } from 'vitest'

import { getGsiIdApi, waitForGsiIdApi } from '../lib/googleAuth'

function stubGsi(value: unknown) {
  if (value === undefined) {
    delete (window as { google?: unknown }).google
    return
  }
  ;(window as { google?: unknown }).google = { accounts: { id: value } }
}

afterEach(() => {
  stubGsi(undefined)
})

describe('getGsiIdApi', () => {
  it('returns undefined when nothing is loaded', () => {
    stubGsi(undefined)
    expect(getGsiIdApi()).toBeUndefined()
  })

  it('returns the api once google.accounts.id exists', () => {
    const api = { initialize: () => {}, renderButton: () => {} }
    stubGsi(api)
    expect(getGsiIdApi()).toBe(api)
  })
})

describe('waitForGsiIdApi', () => {
  it('resolves with the api when it is already present', async () => {
    const api = { initialize: () => {}, renderButton: () => {} }
    stubGsi(api)

    await expect(waitForGsiIdApi(1000, 5)).resolves.toBe(api)
  })

  it('resolves with null when the api never appears, instead of hanging', async () => {
    stubGsi(undefined)

    await expect(waitForGsiIdApi(60, 10)).resolves.toBeNull()
  })

  it('picks the api up as soon as it becomes available', async () => {
    stubGsi(undefined)
    const api = { initialize: () => {}, renderButton: () => {} }
    setTimeout(() => stubGsi(api), 25)

    await expect(waitForGsiIdApi(2000, 5)).resolves.toBe(api)
  })

  it('polls rather than checking once', async () => {
    stubGsi(undefined)
    const started = Date.now()

    await expect(waitForGsiIdApi(80, 20)).resolves.toBeNull()

    // At least a few poll intervals must have elapsed.
    expect(Date.now() - started).toBeGreaterThanOrEqual(60)
  })
})
