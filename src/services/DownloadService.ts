/**
 * DownloadService.ts
 * Handles model downloads from Hugging Face using expo-file-system (Expo Go compatible).
 * Uses the legacy API to avoid deprecation warnings during download.
 * Resolves redirects first so Android (which may not follow 302s) gets a direct CDN URL.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { runInAction } from 'mobx';
import { modelStore, Model, CuratedModel, CURATED_MODELS } from '../stores/ModelStore';
import { withToken, getGGUFFiles } from './HuggingFaceService';

/** Resolve final URL after redirects (HF redirects to CDN; FileSystem on Android may not follow). Uses fetch so response.url is the final URL. */
async function resolveDownloadUrl(url: string): Promise<string> {
  try {
    const sep = url.includes('?') ? '&' : '?';
    const urlWithDownload = `${url}${sep}download=true`;
    // Use GET with Range so we only pull 1 byte; some CDNs respond better to GET than HEAD
    const res = await fetch(urlWithDownload, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'KaviAI/1.0 (React Native; model download)',
        'Range': 'bytes=0-0',
      },
    });
    if (!res.ok && res.status !== 206) return url;
    return res.url || url;
  } catch {
    return url;
  }
}

const MODELS_DIR = FileSystem.documentDirectory + 'kaviai_models/';

// Active download resumables keyed by modelId (for cancel)
const activeDownloads = new Map<string, FileSystem.DownloadResumable>();
// When user cancels, we mark so downloadModel's catch doesn't log or surface as error
const cancelledDownloadIds = new Set<string>();

export async function ensureModelsDir() {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

export function getModelPath(filename: string): string {
  return MODELS_DIR + filename;
}

export async function isModelDownloaded(filename: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(getModelPath(filename));
    return info.exists;
  } catch {
    return false;
  }
}

export async function getModelsDirectorySize(): Promise<number> {
  try {
    await ensureModelsDir();
    const items = await FileSystem.readDirectoryAsync(MODELS_DIR);
    let total = 0;
    for (const name of items) {
      const info = await FileSystem.getInfoAsync(MODELS_DIR + name, { size: true });
      if (info.exists && 'size' in info && typeof info.size === 'number') {
        total += info.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export async function downloadModel(
  curatedModel: CuratedModel,
  onProgress: (percent: number) => void,
): Promise<string | null> {
  await ensureModelsDir();

  // Resolve actual GGUF filename and URL from repo (exact match or first file)
  let effectiveName = curatedModel.name;
  let urlsToTry: string[] = [];
  try {
    const apiFiles = await getGGUFFiles(curatedModel.hfRepoId);
    const exact = apiFiles.find(
      (f) => f.filename.toLowerCase() === curatedModel.name.toLowerCase(),
    );
    const apiFile = exact ?? apiFiles[0];
    if (apiFile?.downloadUrl) {
      effectiveName = apiFile.filename;
      urlsToTry.push(apiFile.downloadUrl);
    }
  } catch (_) {}
  const urlWithToken = withToken(curatedModel.downloadUrl);
  // Prefer URL from HF API (same format the Hub uses); helps with redirect/casing issues e.g. Qwen
  if (curatedModel.downloadUrl) {
    const resolvedUrl = await resolveDownloadUrl(urlWithToken);
    if (resolvedUrl && !urlsToTry.includes(resolvedUrl)) urlsToTry.push(resolvedUrl);
    const fallbackUrl =
      urlWithToken + (urlWithToken.includes('?') ? '&' : '?') + 'download=true';
    if (!urlsToTry.includes(fallbackUrl)) urlsToTry.push(fallbackUrl);
  }
  if (urlsToTry.length === 0) urlsToTry = [urlWithToken];

  const destPath = getModelPath(effectiveName);

  const fileInfo = await FileSystem.getInfoAsync(destPath, { size: true });
  if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
    if (curatedModel.sizeBytes > 0 && fileInfo.size >= curatedModel.sizeBytes * 0.99) {
      onProgress(100);
      const installed: Model = {
        id: curatedModel.id,
        name: effectiveName,
        displayName: curatedModel.displayName,
        filePath: destPath,
        sizeBytes: fileInfo.size,
        sizeLabel: curatedModel.sizeLabel,
        quantization: curatedModel.quantization,
        capabilities: curatedModel.capabilities,
        parameters: curatedModel.parameters,
        author: curatedModel.author,
        hfRepoId: curatedModel.hfRepoId,
        hfUrl: curatedModel.hfUrl,
        isInstalled: true,
        isLoaded: false,
      };
      runInAction(() => modelStore.addInstalledModel(installed));
      return destPath;
    }
    await FileSystem.deleteAsync(destPath);
  }

  runInAction(() => {
    modelStore.setDownloading(curatedModel.id, true);
    modelStore.setDownloadProgress(curatedModel.id, 0);
  });

  const progressCallback = (progress: FileSystem.DownloadProgressData) => {
    const written = progress.totalBytesWritten ?? 0;
    const expected =
      progress.totalBytesExpectedToWrite ?? curatedModel.sizeBytes ?? 1;
    const pct = expected > 0 ? Math.round((written / expected) * 100) : 0;
    const clamped = Math.min(100, Math.max(0, pct));
    runInAction(() => {
      modelStore.setDownloadProgress(curatedModel.id, clamped);
      onProgress(clamped);
    });
  };

  for (let i = 0; i < urlsToTry.length; i++) {
    const downloadUrl = urlsToTry[i];
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      destPath,
      {},
      progressCallback,
    );
    activeDownloads.set(curatedModel.id, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        const installed: Model = {
          id: curatedModel.id,
          name: effectiveName,
          displayName: curatedModel.displayName,
          filePath: result.uri,
          sizeBytes: curatedModel.sizeBytes,
          sizeLabel: curatedModel.sizeLabel,
          quantization: curatedModel.quantization,
          capabilities: curatedModel.capabilities,
          parameters: curatedModel.parameters,
          author: curatedModel.author,
          hfRepoId: curatedModel.hfRepoId,
          hfUrl: curatedModel.hfUrl,
          isInstalled: true,
          isLoaded: false,
        };
        runInAction(() => {
          modelStore.addInstalledModel(installed);
          modelStore.clearDownloadProgress(curatedModel.id);
        });
        return result.uri;
      }
      throw new Error('Download did not return a URI');
    } catch (e: any) {
      const wasCancelled = cancelledDownloadIds.has(curatedModel.id);
      if (wasCancelled) break;
      if (i === 0 && urlsToTry.length > 1) {
        console.warn('[DownloadService] Resolved URL failed, retrying with original URL:', e?.message || e);
        try {
          const info = await FileSystem.getInfoAsync(destPath);
          if (info.exists) await FileSystem.deleteAsync(destPath);
        } catch (_) {}
        runInAction(() => modelStore.setDownloadProgress(curatedModel.id, 0));
        continue;
      }
      console.error('[DownloadService] Download error:', e);
      runInAction(() => modelStore.clearDownloadProgress(curatedModel.id));
      try {
        const info = await FileSystem.getInfoAsync(destPath);
        if (info.exists) await FileSystem.deleteAsync(destPath);
      } catch (_) {}
      cancelledDownloadIds.delete(curatedModel.id);
      return null;
    } finally {
      activeDownloads.delete(curatedModel.id);
    }
  }
  runInAction(() => modelStore.clearDownloadProgress(curatedModel.id));
  cancelledDownloadIds.delete(curatedModel.id);
  return null;
}

export async function cancelDownload(modelId: string): Promise<void> {
  cancelledDownloadIds.add(modelId);
  const resumable = activeDownloads.get(modelId);
  if (resumable) {
    try {
      await resumable.pauseAsync();
    } catch (_) {}
    activeDownloads.delete(modelId);
  }
  runInAction(() => modelStore.clearDownloadProgress(modelId));
}

export async function deleteModelFile(model: Model): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(model.filePath);
    if (info.exists) await FileSystem.deleteAsync(model.filePath);
  } catch (e) {
    console.error('[DownloadService] Delete error:', e);
  }
  runInAction(() => modelStore.removeModel(model.id));
}

/** Sync installed list with device: add curated models that are already on disk, remove entries whose file is gone. */
export async function syncInstalledModelsFromDevice(): Promise<void> {
  try {
    await ensureModelsDir();
    const items = await FileSystem.readDirectoryAsync(MODELS_DIR);
    for (const name of items) {
      if (!name.toLowerCase().endsWith('.gguf')) continue;
      const filePath = getModelPath(name);
      const info = await FileSystem.getInfoAsync(filePath, { size: true });
      if (!info.exists) continue;

      const curated = CURATED_MODELS.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      );

      const sizeBytes =
        'size' in info && typeof info.size === 'number'
          ? info.size
          : curated?.sizeBytes ?? 0;

      if (curated) {
        const existing = modelStore.installedModels.find((m) => m.id === curated.id);
        const installed: Model = {
          id: curated.id,
          name: curated.name,
          displayName: curated.displayName,
          filePath,
          sizeBytes,
          sizeLabel: curated.sizeLabel,
          quantization: curated.quantization,
          capabilities: curated.capabilities,
          parameters: curated.parameters,
          author: curated.author,
          hfRepoId: curated.hfRepoId,
          hfUrl: curated.hfUrl,
          isInstalled: true,
          isLoaded: existing?.isLoaded ?? false,
        };
        runInAction(() => modelStore.addInstalledModel(installed));
      } else {
        // Local model that is not in curated list; still show it so user can delete it.
        const id = `local-${name}`;
        const displayName = name.replace(/\.gguf$/i, '');
        const installed: Model = {
          id,
          name,
          displayName,
          filePath,
          sizeBytes,
          sizeLabel: sizeBytes ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          quantization: 'Unknown',
          capabilities: ['Chat'],
          parameters: 'Unknown',
          author: 'Local',
          hfRepoId: '',
          hfUrl: '',
          isInstalled: true,
          isLoaded: false,
        };
        runInAction(() => modelStore.addInstalledModel(installed));
      }
    }
    for (const m of [...modelStore.installedModels]) {
      try {
        const info = await FileSystem.getInfoAsync(m.filePath);
        if (!info.exists) runInAction(() => modelStore.removeModel(m.id));
      } catch {
        runInAction(() => modelStore.removeModel(m.id));
      }
    }
  } catch (e) {
    console.error('[DownloadService] syncInstalledModelsFromDevice error:', e);
  }
}
