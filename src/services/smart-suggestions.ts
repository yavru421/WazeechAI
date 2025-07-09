/**
 * Advanced AI-Powered Smart Suggestions Engine
 * Context-aware intelligent prompt suggestions
 */

// import { llamaService, type ChatMessage } from './llama-api';
import { type ChatMessage } from './llama-api';

export interface SmartSuggestion {
  id: string;
  text: string;
  category: 'follow-up' | 'creative' | 'technical' | 'analysis' | 'clarification';
  confidence: number;
  reasoning: string;
}

export interface ConversationContext {
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  lastUserIntent: string;
  conversationFlow: string[];
}

export class SmartSuggestionsEngine {
  // private contextHistory: ConversationContext[] = [];
  private userPreferences: Record<string, any> = {};

  constructor() {
    this.loadUserPreferences();
  }

  async generateSuggestions(messages: ChatMessage[]): Promise<SmartSuggestion[]> {
    const context = this.analyzeConversationContext(messages);
    const suggestions: SmartSuggestion[] = [];

    // Generate context-aware suggestions using multiple strategies
    suggestions.push(...await this.generateFollowUpSuggestions(context, messages));
    suggestions.push(...await this.generateCreativeSuggestions(context));
    suggestions.push(...await this.generateTechnicalSuggestions(context, messages));
    suggestions.push(...this.generateClarificationSuggestions(context, messages));

    // Sort by confidence and return top 6
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6)
      .map((s, i) => ({ ...s, id: `suggestion-${i}` }));
  }

  private analyzeConversationContext(messages: ChatMessage[]): ConversationContext {
    if (messages.length === 0) {
      return {
        topics: [],
        sentiment: 'neutral',
        complexity: 'beginner',
        lastUserIntent: 'greeting',
        conversationFlow: []
      };
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const topics = this.extractTopics(messages);
    const sentiment = this.analyzeSentiment(lastUserMessage);
    const complexity = this.assessComplexity(messages);
    const intent = this.classifyIntent(lastUserMessage);
    const flow = this.analyzeConversationFlow(messages);

    return {
      topics,
      sentiment,
      complexity,
      lastUserIntent: intent,
      conversationFlow: flow
    };
  }

  private async generateFollowUpSuggestions(context: ConversationContext, messages: ChatMessage[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    if (context.lastUserIntent === 'question' && messages.length > 1) {
      suggestions.push({
        id: '',
        text: 'Can you explain that in more detail?',
        category: 'follow-up',
        confidence: 0.9,
        reasoning: 'User asked a question, likely wants deeper explanation'
      });

      suggestions.push({
        id: '',
        text: 'What are some examples of this?',
        category: 'follow-up',
        confidence: 0.8,
        reasoning: 'Examples help clarify abstract concepts'
      });
    }

    if (context.topics.length > 0) {
      const mainTopic = context.topics[0];
      suggestions.push({
        id: '',
        text: `What are the latest developments in ${mainTopic}?`,
        category: 'follow-up',
        confidence: 0.7,
        reasoning: 'Stay current with topic trends'
      });
    }

    return suggestions;
  }

  private async generateCreativeSuggestions(_context: ConversationContext): Promise<SmartSuggestion[]> {
    const creative = [
      'Let\'s brainstorm some creative solutions',
      'Can you help me think outside the box?',
      'What would be an unconventional approach?',
      'How would you gamify this?',
      'What metaphor would best describe this?'
    ];

    return creative.map(text => ({
      id: '',
      text,
      category: 'creative' as const,
      confidence: Math.random() * 0.6 + 0.4,
      reasoning: 'Encourages creative thinking'
    }));
  }

  private async generateTechnicalSuggestions(_context: ConversationContext, _messages: ChatMessage[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    if (_context.topics.some((t: string) => ['code', 'programming', 'software', 'api'].some(tech => t.includes(tech)))) {
      suggestions.push({
        id: '',
        text: 'Can you show me the code for this?',
        category: 'technical',
        confidence: 0.85,
        reasoning: 'Technical context detected'
      });

      suggestions.push({
        id: '',
        text: 'What are the best practices here?',
        category: 'technical',
        confidence: 0.8,
        reasoning: 'Best practices are valuable in technical discussions'
      });
    }

    return suggestions;
  }

  private generateClarificationSuggestions(context: ConversationContext, messages: ChatMessage[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (context.complexity === 'advanced') {
      suggestions.push({
        id: '',
        text: 'Can you simplify this explanation?',
        category: 'clarification',
        confidence: 0.7,
        reasoning: 'Complex content may need simplification'
      });
    }

    if (messages.length > 5) {
      suggestions.push({
        id: '',
        text: 'Can you summarize our conversation so far?',
        category: 'analysis',
        confidence: 0.6,
        reasoning: 'Long conversations benefit from summaries'
      });
    }

    return suggestions;
  }

  private extractTopics(messages: ChatMessage[]): string[] {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const topicKeywords = [
      'programming', 'code', 'software', 'api', 'database', 'ai', 'machine learning',
      'design', 'business', 'marketing', 'science', 'technology', 'health', 'education'
    ];

    return topicKeywords.filter(keyword => allText.includes(keyword));
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'helpful', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'wrong', 'error', 'problem'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private assessComplexity(messages: ChatMessage[]): 'beginner' | 'intermediate' | 'advanced' {
    const recentMessages = messages.slice(-3);
    const avgLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;

    if (avgLength > 200) return 'advanced';
    if (avgLength > 100) return 'intermediate';
    return 'beginner';
  }

  private classifyIntent(text: string): string {
    if (text.includes('?')) return 'question';
    if (text.includes('help') || text.includes('how')) return 'help-seeking';
    if (text.includes('explain') || text.includes('tell me')) return 'explanation-request';
    return 'statement';
  }

  private analyzeConversationFlow(messages: ChatMessage[]): string[] {
    return messages.slice(-5).map(m => m.role);
  }

  private loadUserPreferences() {
    const stored = localStorage.getItem('pwllama_user_preferences');
    if (stored) {
      try {
        this.userPreferences = JSON.parse(stored);
      } catch {}
    }
  }

  updateUserPreferences(preferences: Record<string, any>) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    localStorage.setItem('pwllama_user_preferences', JSON.stringify(this.userPreferences));
  }
}

export const smartSuggestionsEngine = new SmartSuggestionsEngine();
