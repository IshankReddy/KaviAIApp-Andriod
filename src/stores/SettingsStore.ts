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
  /** Hugging Face access token for API and gated model downloads */
  hfAccessToken: string;
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
  app: AppSettings = { darkMode: true, storageUsageBytes: 0, hfAccessToken: '' };

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
        if (typeof saved.app?.hfAccessToken === 'string') {
          this.app.hfAccessToken = saved.app.hfAccessToken;
        }
        // One-time bump: longer default so stories don't cut off mid-sentence
        if (this.inference.nPredict === 1024) {
          this.inference.nPredict = 2048;
          this.saveToStorage();
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        inference: this.inference,
        app: this.app,
      }));
    } catch (e) {
      console.error('Failed to save settings', e);
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
