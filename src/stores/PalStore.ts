import { makeAutoObservable } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Pal {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  defaultModelId?: string;
  createdAt: number;
}

const STORAGE_KEY = '@kaviai_pals';

const STARTER_PALS: Pal[] = [
  {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    emoji: '💻',
    description: 'Expert programmer for all your coding needs',
    systemPrompt: 'You are an expert software engineer. Provide clear, concise, and well-documented code. Explain your reasoning when helpful. Prefer modern best practices.',
    temperature: 0.3,
    createdAt: Date.now(),
  },
  {
    id: 'study-tutor',
    name: 'Study Tutor',
    emoji: '📚',
    description: 'Patient tutor that explains concepts clearly',
    systemPrompt: 'You are a patient and knowledgeable tutor. Break down complex concepts into simple, understandable parts. Use examples and analogies. Encourage the student.',
    temperature: 0.6,
    createdAt: Date.now(),
  },
  {
    id: 'writing-helper',
    name: 'Writing Helper',
    emoji: '✍️',
    description: 'Creative writing partner and editor',
    systemPrompt: 'You are a skilled writer and editor. Help with creative writing, essays, emails, and any text. Offer suggestions for clarity, style, and impact.',
    temperature: 0.8,
    createdAt: Date.now(),
  },
  {
    id: 'creative-storyteller',
    name: 'Storyteller',
    emoji: '🎭',
    description: 'Immersive storytelling and world-building',
    systemPrompt: 'You are a creative storyteller with a vivid imagination. Craft engaging narratives, interesting characters, and immersive worlds. Embrace adventure and wonder.',
    temperature: 0.9,
    createdAt: Date.now(),
  },
];

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

class PalStore {
  pals: Pal[] = [];

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.pals = JSON.parse(raw);
      } else {
        this.pals = STARTER_PALS;
        this.saveToStorage();
      }
    } catch (e) {
      this.pals = STARTER_PALS;
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.pals));
    } catch (e) {
      console.error('Failed to save pals', e);
    }
  }

  createPal(data: Omit<Pal, 'id' | 'createdAt'>) {
    const pal: Pal = { ...data, id: generateId(), createdAt: Date.now() };
    this.pals.push(pal);
    this.saveToStorage();
    return pal;
  }

  updatePal(id: string, data: Partial<Omit<Pal, 'id' | 'createdAt'>>) {
    const pal = this.pals.find(p => p.id === id);
    if (pal) Object.assign(pal, data);
    this.saveToStorage();
  }

  deletePal(id: string) {
    this.pals = this.pals.filter(p => p.id !== id);
    this.saveToStorage();
  }

  getPal(id: string): Pal | undefined {
    return this.pals.find(p => p.id === id);
  }
}

export const palStore = new PalStore();
