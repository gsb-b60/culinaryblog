import { IFileStorageService } from '../../application/interfaces/IFileStorageService.js';

import { FileCleanupJobData } from './queues/fileCleanupQueue.js';

// Only delete objects in this recipe's directory, never external/shared files.
export function getRecipeFileKey(url: string, recipeId: string, baseUrl: string): string | null {
  const target = new URL(url);
  const base = new URL(baseUrl);
  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return null;
  const key = decodeURIComponent(target.pathname.slice(base.pathname.length));
  if (!key.startsWith(`recipes/${recipeId}/`) || key.includes('..') || key.includes('\\'))
    return null;
  return key;
}

export async function processFileCleanup(
  data: FileCleanupJobData,
  storage: IFileStorageService,
): Promise<void> {
  const key = getRecipeFileKey(data.url, data.recipeId, storage.getFileUrl(''));
  if (key) await storage.deleteFile(key);
}
