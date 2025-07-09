/**
 * AI-Generated Dynamic Themes Engine
 * Adaptive UI themes based on conversation mood and context
 */

import type { ChatMessage } from './llama-api';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  gradient: string;
}

export interface DynamicTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  mood: 'energetic' | 'calm' | 'professional' | 'creative' | 'futuristic' | 'warm';
  contextScore: number;
}

export class DynamicThemeEngine {
  private currentTheme: DynamicTheme | null = null;
  private themeHistory: DynamicTheme[] = [];

  constructor() {
    this.loadThemeHistory();
  }

  async generateThemeFromConversation(messages: ChatMessage[]): Promise<DynamicTheme> {
    const context = this.analyzeConversationMood(messages);
    const mood = this.determineMood(context);
    const colors = this.generateColorsForMood(mood);

    const theme: DynamicTheme = {
      id: `theme-${Date.now()}`,
      name: this.generateThemeName(mood, context),
      description: this.generateThemeDescription(mood, context),
      colors,
      mood,
      contextScore: context.confidence
    };

    this.saveTheme(theme);
    return theme;
  }

  private analyzeConversationMood(messages: ChatMessage[]): any {
    if (messages.length === 0) {
      return { mood: 'professional', confidence: 0.5, topics: [], energy: 0.5 };
    }

    const recentMessages = messages.slice(-5);
    const text = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // Analyze mood indicators
    const moodIndicators = {
      energetic: ['exciting', 'amazing', 'incredible', 'fantastic', 'awesome', '!', 'wow'],
      calm: ['peaceful', 'relaxing', 'gentle', 'smooth', 'quiet', 'serene'],
      professional: ['business', 'work', 'meeting', 'project', 'deadline', 'professional'],
      creative: ['creative', 'imagine', 'design', 'art', 'innovative', 'brainstorm'],
      futuristic: ['ai', 'technology', 'future', 'innovation', 'digital', 'cyber', 'tech'],
      warm: ['friendly', 'welcome', 'comfortable', 'cozy', 'personal', 'family']
    };

    const scores: Record<string, number> = {};

    for (const [mood, indicators] of Object.entries(moodIndicators)) {
      scores[mood] = indicators.reduce((count, indicator) => {
        return count + (text.split(indicator).length - 1);
      }, 0);
    }

    // Determine dominant mood
    const dominantMood = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    // Calculate energy level (based on punctuation and word choice)
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const energy = Math.min(1, (exclamationCount + questionCount) / recentMessages.length);

    return {
      mood: dominantMood,
      confidence: Math.max(0.3, scores[dominantMood] / 10),
      topics: this.extractTopics(text),
      energy
    };
  }

  private determineMood(context: any): DynamicTheme['mood'] {
    return context.mood as DynamicTheme['mood'];
  }

  private generateColorsForMood(mood: DynamicTheme['mood']): ThemeColors {
    const moodPalettes = {
      energetic: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        background: '#F8F9FA',
        surface: '#FFFFFF',
        text: '#2C3E50',
        accent: '#FFE66D',
        gradient: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)'
      },
      calm: {
        primary: '#6C5CE7',
        secondary: '#A29BFE',
        background: '#F1F2F6',
        surface: '#FFFFFF',
        text: '#2F3542',
        accent: '#FD79A8',
        gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)'
      },
      professional: {
        primary: '#2F3542',
        secondary: '#57606F',
        background: '#F1F2F6',
        surface: '#FFFFFF',
        text: '#2F3542',
        accent: '#3742FA',
        gradient: 'linear-gradient(135deg, #2F3542, #57606F)'
      },
      creative: {
        primary: '#FF3838',
        secondary: '#FF9F43',
        background: '#FFF5F5',
        surface: '#FFFFFF',
        text: '#2C2C54',
        accent: '#7F8C8D',
        gradient: 'linear-gradient(135deg, #FF3838, #FF9F43, #7F8C8D)'
      },
      futuristic: {
        primary: '#00D2D3',
        secondary: '#FF0080',
        background: '#0A0E27',
        surface: '#1E1E2E',
        text: '#FFFFFF',
        accent: '#FFB800',
        gradient: 'linear-gradient(135deg, #00D2D3, #FF0080)'
      },
      warm: {
        primary: '#E17055',
        secondary: '#FDCB6E',
        background: '#FEF7F0',
        surface: '#FFFFFF',
        text: '#5D4E37',
        accent: '#6C5CE7',
        gradient: 'linear-gradient(135deg, #E17055, #FDCB6E)'
      }
    };

    return moodPalettes[mood];
  }

  private generateThemeName(mood: DynamicTheme['mood'], context: any): string {
    const moodNames = {
      energetic: ['Electric', 'Vibrant', 'Dynamic', 'Pulse', 'Spark'],
      calm: ['Zen', 'Serenity', 'Tranquil', 'Peaceful', 'Harmony'],
      professional: ['Executive', 'Corporate', 'Business', 'Formal', 'Classic'],
      creative: ['Artist', 'Imagination', 'Innovation', 'Vision', 'Inspiration'],
      futuristic: ['Neon', 'Cyber', 'Digital', 'Matrix', 'Quantum'],
      warm: ['Cozy', 'Comfort', 'Embrace', 'Golden', 'Hearth']
    };

    const names = moodNames[mood];
    const baseName = names[Math.floor(Math.random() * names.length)];

    // Add context-specific suffix
    if (context.topics.includes('programming')) return `${baseName} Code`;
    if (context.topics.includes('design')) return `${baseName} Studio`;
    if (context.topics.includes('business')) return `${baseName} Pro`;

    return `${baseName} Flow`;
  }

  private generateThemeDescription(mood: DynamicTheme['mood'], _context: any): string {
    const descriptions = {
      energetic: 'A vibrant theme that matches your high-energy conversation',
      calm: 'A peaceful theme designed for focused, thoughtful discussions',
      professional: 'A clean, business-oriented theme for productive conversations',
      creative: 'An inspiring theme that sparks imagination and creativity',
      futuristic: 'A cutting-edge theme for technology and innovation talks',
      warm: 'A welcoming theme that creates a comfortable conversation space'
    };

    return descriptions[mood];
  }

  private extractTopics(text: string): string[] {
    const topicKeywords = [
      'programming', 'design', 'business', 'art', 'science', 'technology',
      'music', 'writing', 'health', 'education', 'gaming', 'travel'
    ];

    return topicKeywords.filter(topic => text.includes(topic));
  }

  applyTheme(theme: DynamicTheme) {
    this.currentTheme = theme;

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-gradient', theme.colors.gradient);

    // Store current theme
    localStorage.setItem('pwllama_current_theme', JSON.stringify(theme));

    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
  }

  getCurrentTheme(): DynamicTheme | null {
    return this.currentTheme;
  }

  getThemeHistory(): DynamicTheme[] {
    return [...this.themeHistory].reverse().slice(0, 10);
  }

  private saveTheme(theme: DynamicTheme) {
    this.themeHistory.push(theme);

    // Keep only last 20 themes
    if (this.themeHistory.length > 20) {
      this.themeHistory = this.themeHistory.slice(-20);
    }

    localStorage.setItem('pwllama_theme_history', JSON.stringify(this.themeHistory));
  }

  private loadThemeHistory() {
    const stored = localStorage.getItem('pwllama_theme_history');
    if (stored) {
      try {
        this.themeHistory = JSON.parse(stored);
      } catch {}
    }

    // Load current theme
    const currentStored = localStorage.getItem('pwllama_current_theme');
    if (currentStored) {
      try {
        this.currentTheme = JSON.parse(currentStored);
        if (this.currentTheme) {
          this.applyTheme(this.currentTheme);
        }
      } catch {}
    }
  }

  generateRandomTheme(): DynamicTheme {
    const moods: DynamicTheme['mood'][] = ['energetic', 'calm', 'professional', 'creative', 'futuristic', 'warm'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];

    return {
      id: `random-${Date.now()}`,
      name: `Random ${randomMood.charAt(0).toUpperCase() + randomMood.slice(1)}`,
      description: `A randomly generated ${randomMood} theme`,
      colors: this.generateColorsForMood(randomMood),
      mood: randomMood,
      contextScore: 0.5
    };
  }

  resetToDefault() {
    const defaultTheme: DynamicTheme = {
      id: 'default',
      name: 'Default',
      description: 'The original PWLlama theme',
      colors: {
        primary: '#3742FA',
        secondary: '#5352ED',
        background: '#F1F2F6',
        surface: '#FFFFFF',
        text: '#2F3542',
        accent: '#FF3838',
        gradient: 'linear-gradient(135deg, #3742FA, #5352ED)'
      },
      mood: 'professional',
      contextScore: 1.0
    };

    this.applyTheme(defaultTheme);
  }
}

export const dynamicThemeEngine = new DynamicThemeEngine();
