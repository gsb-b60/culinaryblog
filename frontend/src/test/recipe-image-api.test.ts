import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, deleteRecipeImage, setPrimaryRecipeImage, uploadRecipeImage } from '../lib/api'

class FakeUpload {
  addEventListener = vi.fn()
}

class FakeXhr {
  upload = new FakeUpload()
  status = 201
  responseText = JSON.stringify({
    imageId: 'i1',
    originalUrl: 'http://minio/culinary-blog/recipes/r1/image.jpg',
    altText: null,
    isPrimary: true,
  })
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
      imageId: 'i1',
      originalUrl: 'http://minio/culinary-blog/recipes/r1/image.jpg',
      altText: null,
      isPrimary: true,
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

describe('recipe image mutations', () => {
  it('promotes an image through the primary endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'i1', isPrimary: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await setPrimaryRecipeImage('token', 'r1', 'i1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/r1/images/i1/primary'),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })

  it('deletes an image through the image endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteRecipeImage('token', 'r1', 'i1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/r1/images/i1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
