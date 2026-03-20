/**
 * HuggingFaceService.ts
 * Search Hugging Face Hub for GGUF models.
 */

import axios from 'axios';
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
  try {
    const res = await axios.get(`${HF_API}/models`, {
      params: {
        search: query,
        filter: 'gguf',
        sort: 'downloads',
        direction: -1,
        limit,
      },
      headers: getAuthHeaders(),
      timeout: 10000,
    });
    return (res.data as any[]).map(m => ({
      modelId: m.modelId,
      author: m.author ?? '',
      downloads: m.downloads ?? 0,
      likes: m.likes ?? 0,
      tags: m.tags ?? [],
      description: m.cardData?.description ?? '',
    }));
  } catch (e) {
    console.error('[HuggingFaceService] searchGGUFModels error:', e);
    return [];
  }
}

export async function getGGUFFiles(repoId: string): Promise<GGUFFile[]> {
  try {
    const res = await axios.get(`${HF_API}/models/${repoId}`, {
      headers: getAuthHeaders(),
      timeout: 10000,
    });
    const siblings: any[] = res.data.siblings ?? [];
    const baseUrl = `https://huggingface.co/${repoId}/resolve/main/`;
    return siblings
      .filter(f => f.rfilename?.endsWith('.gguf'))
      .map(f => {
        const size = f.size ?? 0;
        const url = baseUrl + f.rfilename;
        return {
          filename: f.rfilename,
          size,
          sizeLabel: formatBytes(size),
          downloadUrl: withToken(url),
        };
      });
  } catch (e) {
    console.error('[HuggingFaceService] getGGUFFiles error:', e);
    return [];
  }
}

export async function getModelCard(repoId: string): Promise<{ description: string; author: string; tags: string[] }> {
  try {
    const res = await axios.get(`${HF_API}/models/${repoId}`, {
      headers: getAuthHeaders(),
      timeout: 10000,
    });
    return {
      description: res.data.cardData?.description ?? '',
      author: res.data.author ?? '',
      tags: res.data.tags ?? [],
    };
  } catch (e) {
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
