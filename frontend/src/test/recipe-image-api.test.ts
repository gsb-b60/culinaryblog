import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, uploadRecipeImage } from '../lib/api'

class FakeUpload {
  addEventListener = vi.fn()
}

class FakeXhr {
  upload = new FakeUpload()
  status = 201
  responseText = JSON.stringify({ originalUrl: 'http://minio/culinary-blog/recipes/r1/image.jpg' })
  open = vi.fn()
  setRequestHeader = vi.fn()
  send = vi.fn(() => {
    this.loadListeners.forEach((listener) => listener())
  })
  private loadListeners: Array<() => void> = []
  addEventListener = vi.fn((event: string, listener: () => void) => {
    if (event === 'load') this.loadListeners.push(listener)
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('uploadRecipeImage', () => {
  it('sends multipart data with authorization and returns the public URL', async () => {
    const xhr = new FakeXhr()
    vi.stubGlobal('XMLHttpRequest', class { constructor() { return xhr } })
    const file = new File(['image'], 'cover.jpg', { type: 'image/jpeg' })

    await expect(uploadRecipeImage('token', 'recipe/1', file)).resolves.toEqual({
      originalUrl: 'http://minio/culinary-blog/recipes/r1/image.jpg',
    })
    expect(xhr.open).toHaveBeenCalledWith('POST', expect.stringContaining('/recipes/recipe%2F1/images'))
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token')
    expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData))
  })

  it('converts an upload problem response into ApiError', async () => {
    const xhr = new FakeXhr()
    xhr.status = 400
    xhr.responseText = JSON.stringify({
      type: 'FILE_MIME_INVALID',
      status: 400,
      detail: 'Only image files are accepted.',
    })
    vi.stubGlobal('XMLHttpRequest', class { constructor() { return xhr } })

    const error = await uploadRecipeImage('token', 'recipe-1', new File(['bad'], 'bad.txt')).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'Only image files are accepted.' })
  })
})
