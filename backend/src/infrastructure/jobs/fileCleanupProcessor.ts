import { type IFileStorageService } from '../../application/interfaces/IFileStorageService.js';
import { logger } from '../../config-middleware/config/logger.js';

import { type FileCleanupJobData } from './queues/fileCleanupQueue.js';

export function getRecipeFileKey(url: string, recipeId: string, baseUrl: string): string | null {
  let target: URL;
  let base: URL;
  try {
    target = new URL(url);
    base = new URL(baseUrl);
  } catch {
    return null;
  }

  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return null;
  let key: string;
  try {
    key = decodeURIComponent(target.pathname.slice(base.pathname.length));
  } catch {
    return null;
  }
  if (
    !key.startsWith(`recipes/${recipeId}/`) ||
    key.split('/').some((segment) => segment === '.' || segment === '..') ||
    key.includes('\\')
  ) {
    return null;
  }
  return key;
}

function isMissingObject(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === 'NoSuchKey' ||
    candidate.name === 'NotFound' ||
    candidate.Code === 'NoSuchKey' ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

export async function processFileCleanup(
  data: FileCleanupJobData,
  storage: IFileStorageService,
): Promise<void> {
  const key = getRecipeFileKey(data.url, data.recipeId, storage.getFileUrl(''));
  if (!key) {
    logger.warn({ recipeId: data.recipeId }, 'Skipping cleanup for a URL outside recipe storage');
    return;
  }

  try {
    await storage.deleteFile(key);
    logger.info({ recipeId: data.recipeId, key }, 'Deleted recipe file');
  } catch (error) {
    if (isMissingObject(error)) {
      logger.info(
        { recipeId: data.recipeId, key },
        'Recipe file already missing; cleanup is idempotent',
      );
      return;
    }
    // Unknown storage errors propagate so BullMQ can retry the job.
    throw error;
  }
}
