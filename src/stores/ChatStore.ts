import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // Performance metrics (assistant only)
  msPerToken?: number;
  tokensPerSec?: number;
  ttftMs?: number;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  palId?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '@kaviai_chats';

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

class ChatStore {
  conversations: Conversation[] = [];
  activeConversationId: string | null = null;
  isGenerating = false;
  streamingContent = '';

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  get activeConversation(): Conversation | null {
    return this.conversations.find(c => c.id === this.activeConversationId) ?? null;
  }

  get messages(): Message[] {
    return this.activeConversation?.messages ?? [];
  }

  async loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        runInAction(() => {
          this.conversations = JSON.parse(raw);
        });
      }
    } catch (e) {
      console.error('Failed to load chats', e);
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
    } catch (e) {
      console.error('Failed to save chats', e);
    }
  }

  createConversation(modelId: string, palId?: string) {
    const conv: Conversation = {
      id: generateId(),
      title: 'New Chat',
      modelId,
      palId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.conversations.unshift(conv);
    this.activeConversationId = conv.id;
    this.saveToStorage();
    return conv;
  }

  setActiveConversation(id: string | null) {
    this.activeConversationId = id;
  }

  addUserMessage(content: string) {
    if (!this.activeConversation) return null;
    const msg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.activeConversation.messages.push(msg);
    this.activeConversation.updatedAt = Date.now();
    if (this.activeConversation.messages.length === 1) {
      this.activeConversation.title = content.slice(0, 40);
    }
    this.saveToStorage();
    return msg;
  }

  startAssistantMessage() {
    if (!this.activeConversation) return null;
    const msg: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    this.activeConversation.messages.push(msg);
    this.streamingContent = '';
    this.isGenerating = true;
    return msg;
  }

  appendToken(token: string) {
    this.streamingContent += token;
    const msgs = this.activeConversation?.messages;
    if (msgs && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role === 'assistant') {
        last.content = this.streamingContent;
      }
    }
  }

  finalizeAssistantMessage(metrics: Pick<Message, 'msPerToken' | 'tokensPerSec' | 'ttftMs' | 'tokenCount'>) {
    const msgs = this.activeConversation?.messages;
    if (msgs && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role === 'assistant') {
        Object.assign(last, metrics);
        last.content = last.content
          .replace(/<\|(?:im_end|im_start|eot_id|end|endoftext|end_of_turn|assistant|user|system|start_header_id|end_header_id)\|?>?[a-z]*/g, '')
          .replace(/<\/s>/g, '')
          .replace(/\n(User|Assistant|Human|Response|user|assistant|human|response):[\s\S]*$/m, '')
          .trim();
      }
    }
    this.isGenerating = false;
    this.streamingContent = '';
    this.saveToStorage();
  }

  setIsGenerating(val: boolean) {
    this.isGenerating = val;
  }

  deleteConversation(id: string) {
    this.conversations = this.conversations.filter(c => c.id !== id);
    if (this.activeConversationId === id) {
      this.activeConversationId = this.conversations[0]?.id ?? null;
    }
    this.saveToStorage();
  }

  clearAllChats() {
    this.conversations = [];
    this.activeConversationId = null;
    this.saveToStorage();
  }
}

export const chatStore = new ChatStore();
