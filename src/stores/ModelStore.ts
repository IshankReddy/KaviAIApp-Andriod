import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceRAMGb, getRecommendedMaxBytes, getDeviceCompatibility, getDeviceModelName, DeviceCompatibility } from '../utils/DeviceInfo';

export interface Model {
  id: string;
  name: string;
  displayName: string;
  filePath: string;
  sizeBytes: number;
  sizeLabel: string;
  quantization: string;
  capabilities: string[];
  parameters: string;
  author: string;
  hfRepoId: string;
  hfUrl: string;
  isInstalled: boolean;
  isLoaded: boolean;
}

export type ModelCategory = 'coding' | 'chat' | 'reasoning' | 'image' | 'video' | 'audio' | 'health' | 'news';

export interface CuratedModel {
  id: string;
  displayName: string;
  name: string;
  quantization: string;
  sizeLabel: string;
  sizeBytes: number;
  capabilities: string[];
  parameters: string;
  author: string;
  hfRepoId: string;
  hfUrl: string;
  downloadUrl: string;
  categories?: ModelCategory[];
}

export type ModelSortOption = 'sizeAsc' | 'sizeDesc';

/** Parse parameters string (e.g. "360M", "1.1B", "3.8B") to value in billions for sorting/filtering. */
export function parametersToB(parameters: string): number {
  const s = (parameters || '').trim().toUpperCase();
  const match = s.match(/^([\d.]+)\s*([MB])?$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2] || 'B';
  return unit === 'M' ? num / 1000 : num;
}

export const CURATED_MODELS: CuratedModel[] = [
  {
    id: 'smollm2-360m-q4_0',
    displayName: 'SmolLM2-360M-Instruct (Q4_0)',
    name: 'SmolLM2-360M-Instruct.Q4_0.gguf',
    quantization: 'Q4_0',
    sizeLabel: '0.22 GB',
    sizeBytes: 220000000,
    capabilities: ['Chat', 'Question Answering', 'Instruction Following'],
    parameters: '360M',
    author: 'QuantFactory',
    hfRepoId: 'QuantFactory/SmolLM2-360M-Instruct-GGUF',
    hfUrl: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF',
    downloadUrl: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_0.gguf',
    categories: ['chat'],
  },
  {
    id: 'tinyllama-1.1b-q4km',
    displayName: 'TinyLlama-1.1B-Chat',
    name: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    quantization: 'Q4_K_M',
    sizeLabel: '0.62 GB',
    sizeBytes: 652000000,
    capabilities: ['Chat', 'Question Answering', 'Instruction Following'],
    parameters: '1.1B',
    author: 'TheBloke',
    hfRepoId: 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
    hfUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
    downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    categories: ['chat'],
  },
  {
    id: 'smollm2-1.7b-q4km',
    displayName: 'SmolLM2-1.7B-Instruct',
    name: 'smollm2-1.7b-instruct-q4_k_m.gguf',
    quantization: 'Q4_K_M',
    sizeLabel: '1.0 GB',
    sizeBytes: 1055609536,
    capabilities: ['Chat', 'Question Answering', 'Instruction Following'],
    parameters: '1.7B',
    author: 'HuggingFaceTB',
    hfRepoId: 'HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF',
    hfUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF',
    downloadUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf',
    categories: ['chat', 'news'],
  },
  {
    id: 'smollm2-360m-instruct-q8',
    displayName: 'SmolLM2-360M-Instruct',
    name: 'smollm2-360m-instruct-q8_0.gguf',
    quantization: 'Q8_0',
    sizeLabel: '0.37 GB',
    sizeBytes: 386404992,
    capabilities: ['Chat', 'Question Answering', 'Instruction Following'],
    parameters: '360M',
    author: 'HuggingFaceTB',
    hfRepoId: 'HuggingFaceTB/SmolLM2-360M-Instruct-GGUF',
    hfUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF',
    downloadUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf',
    categories: ['chat'],
  },
  {
    id: 'qwen2.5-1.5b-q8',
    displayName: 'Qwen2.5-1.5B-Instruct',
    name: 'Qwen2.5-1.5B-Instruct-Q8_0.gguf',
    quantization: 'Q8_0',
    sizeLabel: '1.89 GB',
    sizeBytes: 1890000000,
    capabilities: ['Chat', 'Question Answering', 'Reasoning'],
    parameters: '1.5B',
    author: 'Qwen',
    hfRepoId: 'Qwen/Qwen2.5-1.5B-Instruct-GGUF',
    hfUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf',
    categories: ['coding', 'reasoning', 'chat'],
  },
  {
    id: 'gemma-2-2b-q6k',
    displayName: 'Gemma-2-2b-it',
    name: 'gemma-2-2b-it-Q6_K.gguf',
    quantization: 'Q6_K',
    sizeLabel: '2.15 GB',
    sizeBytes: 2150000000,
    capabilities: ['Question Answering', 'Summarization', 'Reasoning'],
    parameters: '2.61B',
    author: 'bartowski',
    hfRepoId: 'bartowski/gemma-2-2b-it-GGUF',
    hfUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF',
    downloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q6_K.gguf',
    categories: ['chat', 'reasoning', 'news'],
  },
  {
    id: 'phi-3.5-mini-q4km',
    displayName: 'Phi-3.5 mini 4k instruct',
    name: 'Phi-3.5-mini-instruct-Q4_K_M.gguf',
    quantization: 'Q4_K_M',
    sizeLabel: '2.39 GB',
    sizeBytes: 2390000000,
    capabilities: ['Code', 'Reasoning', 'Math', 'Instruction Following'],
    parameters: '3.8B',
    author: 'bartowski',
    hfRepoId: 'bartowski/Phi-3.5-mini-instruct-GGUF',
    hfUrl: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF',
    downloadUrl: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    categories: ['coding', 'reasoning'],
  },
  {
    id: 'deepseek-r1-distill-1.5b-q4_0',
    displayName: 'DeepSeek-R1-Distill-Qwen-1.5B',
    name: 'deepseek-r1-distill-qwen-1.5b-q4_0.gguf',
    quantization: 'Q4_0',
    sizeLabel: '1.0 GB',
    sizeBytes: 1066227008,
    capabilities: ['Chat', 'Question Answering', 'Reasoning'],
    parameters: '1.5B',
    author: 'ggml-org',
    hfRepoId: 'ggml-org/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0-GGUF',
    hfUrl: 'https://huggingface.co/ggml-org/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0-GGUF',
    downloadUrl: 'https://huggingface.co/ggml-org/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0-GGUF/resolve/main/deepseek-r1-distill-qwen-1.5b-q4_0.gguf',
    categories: ['reasoning', 'coding'],
  },
  {
    id: 'deepseek-r1-distill-1.5b-q4km',
    displayName: 'DeepSeek-R1-Distill-Qwen-1.5B (Q4_K_M)',
    name: 'deepseek-r1-distill-qwen-1.5b-q4_k_m.gguf',
    quantization: 'Q4_K_M',
    sizeLabel: '1.1 GB',
    sizeBytes: 1117320544,
    capabilities: ['Chat', 'Question Answering', 'Reasoning'],
    parameters: '1.5B',
    author: 'turingevo',
    hfRepoId: 'turingevo/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M-GGUF',
    hfUrl: 'https://huggingface.co/turingevo/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M-GGUF',
    downloadUrl: 'https://huggingface.co/turingevo/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M-GGUF/resolve/main/deepseek-r1-distill-qwen-1.5b-q4_k_m.gguf',
    categories: ['reasoning', 'coding'],
  },
];

const STORAGE_KEY = '@kaviai_models';

class ModelStore {
  installedModels: Model[] = [];
  activeModel: Model | null = null;
  downloadProgress: Map<string, number> = new Map();
  downloadingIds: Set<string> = new Set();
  isLoadingModel = false;
  llamaContext: any = null;

  // Device info
  deviceRAMGb: number = 4;
  deviceModelName: string = '';
  recommendedMaxBytes: number = 1024 * 1024 * 1024; // 1 GB default

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
    this.initDeviceInfo();
  }

  initDeviceInfo() {
    this.deviceRAMGb = getDeviceRAMGb();
    this.deviceModelName = getDeviceModelName();
    this.recommendedMaxBytes = getRecommendedMaxBytes(this.deviceRAMGb);
  }

  /** Check compatibility of a model with this device. */
  getCompatibility(sizeBytes: number): DeviceCompatibility {
    return getDeviceCompatibility(sizeBytes, this.deviceRAMGb);
  }

  get hasModels() {
    return this.installedModels.length > 0;
  }

  get isModelLoaded() {
    return this.activeModel?.isLoaded && this.llamaContext !== null;
  }

  async loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        runInAction(() => {
          this.installedModels = JSON.parse(raw);
        });
      }
    } catch (e) {
      console.error('Failed to load models from storage', e);
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.installedModels));
    } catch (e) {
      console.error('Failed to save models', e);
    }
  }

  addInstalledModel(model: Model) {
    const existing = this.installedModels.findIndex(m => m.id === model.id);
    if (existing >= 0) {
      this.installedModels[existing] = model;
    } else {
      this.installedModels.push(model);
    }
    this.saveToStorage();
  }

  removeModel(modelId: string) {
    this.installedModels = this.installedModels.filter(m => m.id !== modelId);
    if (this.activeModel?.id === modelId) {
      this.activeModel = null;
    }
    this.saveToStorage();
  }

  setDownloadProgress(modelId: string, progress: number) {
    this.downloadProgress.set(modelId, progress);
  }

  clearDownloadProgress(modelId: string) {
    this.downloadProgress.delete(modelId);
    this.downloadingIds.delete(modelId);
  }

  setDownloading(modelId: string, value: boolean) {
    if (value) {
      this.downloadingIds.add(modelId);
    } else {
      this.downloadingIds.delete(modelId);
    }
  }

  setActiveModel(model: Model | null) {
    this.activeModel = model;
  }

  setIsLoadingModel(val: boolean) {
    this.isLoadingModel = val;
  }

  setLlamaContext(ctx: any) {
    this.llamaContext = ctx;
  }

  setModelLoaded(modelId: string, loaded: boolean) {
    const m = this.installedModels.find(m => m.id === modelId);
    if (m) m.isLoaded = loaded;
    if (this.activeModel?.id === modelId) {
      this.activeModel = { ...this.activeModel, isLoaded: loaded };
    }
  }
}

export const modelStore = new ModelStore();
