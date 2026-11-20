import { describe, expect, it } from 'vitest';

import {
  assertImageSize,
  buildImageKey,
  detectAllowedImage,
  MAX_IMAGE_SIZE_BYTES,
} from '../src/presentation/file-upload.js';

const fixtures = {
  jpeg: Buffer.from('ffd8ffe000104a464946000101', 'hex'),
  png: Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'),
  webp: Buffer.from('52494646000000005745425056503820', 'hex'),
  avif: Buffer.from('0000001c667479706176696600000000', 'hex'),
};

describe('file upload validation', () => {
  it.each(Object.entries(fixtures))('accepts magic bytes for %s', async (_name, bytes) => {
    await expect(detectAllowedImage(bytes)).resolves.toBeTruthy();
  });

  it('rejects content that only claims to be an image', async () => {
    await expect(detectAllowedImage(Buffer.from('not an image'))).rejects.toMatchObject({
      code: 'FILE_MIME_INVALID',
      statusCode: 400,
    });
  });

  it('rejects files over 5 MB', () => {
    expect(() => assertImageSize(MAX_IMAGE_SIZE_BYTES + 1)).toThrowError(
      expect.objectContaining({ code: 'FILE_SIZE_EXCEEDED', statusCode: 400 }),
    );
  });

  it('allows files at exactly 5 MB', () => {
    expect(() => assertImageSize(MAX_IMAGE_SIZE_BYTES)).not.toThrow();
  });

  it('creates UUID-based recipe keys without using an original filename', () => {
    const key = buildImageKey('recipe-1', 'jpg');
    expect(key).toMatch(/^recipes\/recipe-1\/[0-9a-f-]{36}\.jpg$/);
    expect(key).not.toContain('..');
  });
});
