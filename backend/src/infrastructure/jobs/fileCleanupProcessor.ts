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

export async function processFileCleanup(
  data: FileCleanupJobData,
  storage: IFileStorageService,
): Promise<void> {
  const key = getRecipeFileKey(data.url, data.recipeId, storage.getFileUrl(''));
  if (!key) {
    logger.warn({ recipeId: data.recipeId }, 'Skipping cleanup for a URL outside recipe storage');
    return;
  }
  await storage.deleteFile(key);
}
