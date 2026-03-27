import { makeAutoObservable } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InferenceSettings {
  nPredict: number;
  temperature: number;
  topK: number;
  topP: number;
  minP: number;
  repeatPenalty: number;
  contextLength: number;
  gpuLayers: number;
  includeThinkingInContext: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  storageUsageBytes: number;
  /** Chat backend */
  chatBackend: 'local' | 'openai' | 'anthropic' | 'gemini';
  /** Default cloud model IDs (provider-specific) */
  openaiModel: string;
  anthropicModel: string;
  geminiModel: string;
}

const STORAGE_KEY = '@kaviai_settings';

const DEFAULTS: InferenceSettings = {
  nPredict: 2048,
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  minP: 0.05,
  repeatPenalty: 1.1,
  contextLength: 2048,
  gpuLayers: 99,
  includeThinkingInContext: false,
};

class SettingsStore {
  inference: InferenceSettings = { ...DEFAULTS };
  app: AppSettings = {
    darkMode: true,
    storageUsageBytes: 0,
    chatBackend: 'local',
    openaiModel: 'gpt-4.1',
    anthropicModel: 'claude-sonnet-4-6',
    geminiModel: 'gemini-2.5-flash',
  };

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(this.inference, saved.inference ?? {});
        Object.assign(this.app, saved.app ?? {});
        // One-time bump: longer default so stories don't cut off mid-sentence
        if (this.inference.nPredict === 1024) {
          this.inference.nPredict = 2048;
          this.saveToStorage();
        }
      }
    } catch (e) {
      if (__DEV__) console.error('Failed to load settings', e);
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        inference: this.inference,
        app: this.app,
      }));
    } catch (e) {
      if (__DEV__) console.error('Failed to save settings', e);
    }
  }

  setInference<K extends keyof InferenceSettings>(key: K, value: InferenceSettings[K]) {
    this.inference[key] = value;
    this.saveToStorage();
  }

  resetInferenceToDefaults() {
    this.inference = { ...DEFAULTS };
    this.saveToStorage();
  }

  setApp<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.app[key] = value;
    this.saveToStorage();
  }
}

export const settingsStore = new SettingsStore();
