/**
 * HuggingFaceService.ts
 * Search Hugging Face Hub for GGUF text-generation models.
 */

import { secretsStore } from '../stores/SecretsStore';

const HF_API = 'https://huggingface.co/api';

function getAuthHeaders(): Record<string, string> {
  const token = secretsStore.hfToken?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Append HF token to a URL for authenticated downloads (gated/private models). */
export function withToken(url: string): string {
  const token = secretsStore.hfToken?.trim();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export interface HFModel {
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  description?: string;
}

export interface GGUFFile {
  filename: string;
  size: number;
  sizeLabel: string;
  downloadUrl: string;
}

export async function searchGGUFModels(query: string, limit = 20): Promise<HFModel[]> {
  const params = new URLSearchParams({
    search: query,
    filter: 'gguf',
    pipeline_tag: 'text-generation',
    sort: 'downloads',
    direction: '-1',
    limit: String(limit),
  });
  const url = `${HF_API}/models?${params.toString()}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Hugging Face search failed (${res.status})`);
  }
  const data: any[] = await res.json();
  return data.map(m => ({
    modelId: m.id ?? m.modelId ?? '',
    author: m.author ?? '',
    downloads: m.downloads ?? 0,
    likes: m.likes ?? 0,
    tags: m.tags ?? [],
    description: m.cardData?.description ?? '',
  }));
}

export async function getGGUFFiles(repoId: string): Promise<GGUFFile[]> {
  const url = `${HF_API}/models/${repoId}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch repo info (${res.status})`);
  }
  const data = await res.json();
  const siblings: any[] = data.siblings ?? [];
  const baseUrl = `https://huggingface.co/${repoId}/resolve/main/`;
  return siblings
    .filter(f => f.rfilename?.endsWith('.gguf'))
    .map(f => {
      const size = f.size ?? 0;
      const dlUrl = baseUrl + f.rfilename;
      return {
        filename: f.rfilename,
        size,
        sizeLabel: formatBytes(size),
        downloadUrl: withToken(dlUrl),
      };
    });
}

export async function getModelCard(repoId: string): Promise<{ description: string; author: string; tags: string[] }> {
  try {
    const url = `${HF_API}/models/${repoId}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders(), Accept: 'application/json' },
    });
    if (!res.ok) return { description: '', author: '', tags: [] };
    const data = await res.json();
    return {
      description: data.cardData?.description ?? '',
      author: data.author ?? '',
      tags: data.tags ?? [],
    };
  } catch {
    return { description: '', author: '', tags: [] };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
