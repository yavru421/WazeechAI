// Conversation Manager Utility for PWLlama
// Handles persistent, searchable, exportable conversation history

import type { ChatMessage } from '../services/llama-api';

export interface Conversation {
  id: string;
  name: string;
  created: number;
  updated: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'pwllama_conversations_v1';

export class ConversationManager {
  private conversations: Conversation[] = [];
  private loaded = false;

  async load() {
    if (this.loaded) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.conversations = JSON.parse(raw);
      } catch {
        this.conversations = [];
      }
    }
    this.loaded = true;
  }

  async save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
  }

  async getAll(): Promise<Conversation[]> {
    await this.load();
    return this.conversations.slice().sort((a, b) => b.updated - a.updated);
  }

  async get(id: string): Promise<Conversation | undefined> {
    await this.load();
    return this.conversations.find(c => c.id === id);
  }

  async create(name = 'New Chat'): Promise<Conversation> {
    await this.load();
    const now = Date.now();
    const conv: Conversation = {
      id: Math.random().toString(36).slice(2) + now,
      name,
      created: now,
      updated: now,
      messages: []
    };
    this.conversations.unshift(conv);
    await this.save();
    return conv;
  }

  async update(conv: Conversation) {
    await this.load();
    const idx = this.conversations.findIndex(c => c.id === conv.id);
    if (idx !== -1) {
      this.conversations[idx] = { ...conv, updated: Date.now() };
      await this.save();
    }
  }

  async delete(id: string) {
    await this.load();
    this.conversations = this.conversations.filter(c => c.id !== id);
    await this.save();
  }

  async rename(id: string, name: string) {
    await this.load();
    const conv = this.conversations.find(c => c.id === id);
    if (conv) {
      conv.name = name;
      conv.updated = Date.now();
      await this.save();
    }
  }

  async addMessage(id: string, msg: ChatMessage) {
    await this.load();
    const conv = this.conversations.find(c => c.id === id);
    if (conv) {
      conv.messages.push(msg);
      conv.updated = Date.now();
      await this.save();
    }
  }

  async search(query: string): Promise<Conversation[]> {
    await this.load();
    const q = query.toLowerCase();
    return this.conversations.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }

  async export(id: string): Promise<string> {
    await this.load();
    const conv = this.conversations.find(c => c.id === id);
    if (!conv) return '';
    return JSON.stringify(conv, null, 2);
  }

  async import(raw: string) {
    try {
      const conv: Conversation = JSON.parse(raw);
      if (conv && conv.id && Array.isArray(conv.messages)) {
        this.conversations.unshift({ ...conv, updated: Date.now() });
        await this.save();
      }
    } catch {}
  }
}

export const conversationManager = new ConversationManager();
