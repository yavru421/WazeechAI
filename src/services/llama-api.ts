/**
 * Llama API Service
 * Provides a wrapper around the llama-api-client with additional PWA-friendly features
 */

export interface LlamaModel {
  id: string;
  name: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  imageUrl?: string; // Optional: base64 or object URL for user-uploaded images
}

export interface ChatResponse {
  content: string;
  model: string;
  tokens?: number;
  responseTime?: number;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export class LlamaAPIService {
  private client: any;
  private apiKey: string | null = null;

  // Available Llama models
  public readonly models: LlamaModel[] = [
    {
      id: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
      name: 'Llama 4 Maverick 17B',
      description: 'Fast and efficient model for general tasks'
    },
    {
      id: 'Llama-4-Scout-17B-16E-Instruct-FP8',
      name: 'Llama 4 Scout 17B',
      description: 'Creative and detailed responses'
    },
    {
      id: 'Llama-3.3-70B-Instruct',
      name: 'Llama 3.3 70B',
      description: 'Most comprehensive and detailed responses'
    },
    {
      id: 'Llama-3.3-8B-Instruct',
      name: 'Llama 3.3 8B',
      description: 'Practical and helpful for everyday tasks'
    }
  ];

  constructor() {
    this.initializeClients();
  }

  private async initializeClients() {
    try {
      // Dynamic import to handle potential module loading issues
      const { LlamaAPIClient } = await import('llama-api-client');

      // Set up API key in environment polyfill
      const apiKey = this.getApiKey();
      if (apiKey && typeof window !== 'undefined') {
        (window as any).process = (window as any).process || {};
        (window as any).process.env = (window as any).process.env || {};
        (window as any).process.env.LLAMA_API_KEY = apiKey;
      }

      this.client = new LlamaAPIClient();
    } catch (error) {
      console.error('Failed to initialize Llama API clients:', error);
      throw new Error('Llama API client not available. Please ensure the API key is set.');
    }
  }

  /**
   * Set the API key (stored in localStorage for PWA persistence)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('llama_api_key', apiKey);
    // Set environment variable for the client
    if (typeof window !== 'undefined') {
      (window as any).process = (window as any).process || {};
      (window as any).process.env = (window as any).process.env || {};
      (window as any).process.env.LLAMA_API_KEY = apiKey;
    }
  }

  /**
   * Get the stored API key
   */
  getApiKey(): string | null {
    if (this.apiKey) return this.apiKey;

    const stored = localStorage.getItem('llama_api_key');
    if (stored) {
      this.apiKey = stored;
      if (typeof window !== 'undefined') {
        (window as any).process = (window as any).process || {};
        (window as any).process.env = (window as any).process.env || {};
        (window as any).process.env.LLAMA_API_KEY = stored;
      }
    }
    return stored;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    messages: ChatMessage[],
    model: string = 'Llama-3.3-70B-Instruct',
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('API key not configured');
    }

    await this.initializeClients();

    const startTime = Date.now();

    try {
      // Clean and validate messages
      let filteredMessages = messages
        .filter(msg => msg.role && msg.content && String(msg.content).trim()) // Only messages with role and non-empty content
        .map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role, // Convert system messages to user messages
          content: String(msg.content).trim()
        }));

      // Ensure conversation starts with a user message
      if (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
        filteredMessages = filteredMessages.slice(1); // Remove leading assistant messages
      }

      // Ensure we have at least one message and it's from user
      if (filteredMessages.length === 0 || filteredMessages[0].role !== 'user') {
        throw new Error('Conversation must start with a user message');
      }

      console.log('Sending messages to API:', filteredMessages);

      const response = await this.client.chat.completions.create({
        model,
        messages: filteredMessages,
        max_completion_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Extract content from the response
      let content = response.completion_message?.content;
      if (!content) {
        content = String(response.completion_message);
      }

      // Handle MessageTextContentItem objects
      if (typeof content === 'object' && content.text) {
        content = content.text;
      }

      return {
        content: String(content),
        model: response.model || model,
        tokens: response.usage?.total_tokens,
        responseTime
      };
    } catch (error) {
      console.error('Chat API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get response: ${message}`);
    }
  }

  /**
   * Send a chat message with streaming response
   */
  async *chatStream(
    messages: ChatMessage[],
    model: string = 'Llama-3.3-70B-Instruct',
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('API key not configured');
    }

    await this.initializeClients();

    try {
      // Clean and validate messages for streaming
      let filteredMessages = messages
        .filter(msg => msg.role && msg.content && String(msg.content).trim()) // Only messages with role and non-empty content
        .map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role, // Convert system messages to user messages
          content: String(msg.content).trim()
        }));

      // Ensure conversation starts with a user message
      if (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
        filteredMessages = filteredMessages.slice(1); // Remove leading assistant messages
      }

      // Ensure we have at least one message and it's from user
      if (filteredMessages.length === 0 || filteredMessages[0].role !== 'user') {
        throw new Error('Conversation must start with a user message');
      }

      console.log('Sending messages to streaming API:', filteredMessages);

      const stream = await this.client.chat.completions.create({
        model,
        messages: filteredMessages,
        max_completion_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.event?.delta?.text) {
          yield {
            text: chunk.event.delta.text,
            isComplete: false
          };
        }
      }

      yield { text: '', isComplete: true };
    } catch (error) {
      console.error('Streaming API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to stream response: ${message}`);
    }
  }

  /**
   * Test all available models with a simple prompt
   */
  async testAllModels(prompt: string = "Hello! Please introduce yourself."): Promise<Record<string, ChatResponse | { error: string }>> {
    if (!this.isConfigured()) {
      throw new Error('API key not configured');
    }

    const results: Record<string, ChatResponse | { error: string }> = {};
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    for (const model of this.models) {
      try {
        results[model.id] = await this.chat(messages, model.id, { maxTokens: 200 });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        results[model.id] = { error: message };
      }
    }

    return results;
  }

  /**
   * Get model performance rankings based on response time and quality
   */
  async benchmarkModels(): Promise<{
    rankings: Array<{
      model: LlamaModel;
      avgResponseTime: number;
      avgLength: number;
      errorCount: number;
      score: number;
    }>;
    testResults: Record<string, any>;
  }> {
    const testPrompts = [
      "Write a haiku about artificial intelligence.",
      "Explain quantum computing in simple terms.",
      "List 3 creative uses for a paperclip."
    ];

    const modelStats: Record<string, {
      responseTimes: number[];
      lengths: number[];
      errors: number;
    }> = {};

    // Initialize stats
    this.models.forEach(model => {
      modelStats[model.id] = {
        responseTimes: [],
        lengths: [],
        errors: 0
      };
    });

    // Test each prompt with each model
    for (const prompt of testPrompts) {
      const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

      for (const model of this.models) {
        try {
          const response = await this.chat(messages, model.id, { maxTokens: 200 });
          modelStats[model.id].responseTimes.push(response.responseTime || 0);
          modelStats[model.id].lengths.push(response.content.length);
        } catch (error) {
          modelStats[model.id].errors++;
        }
      }
    }

    // Calculate rankings
    const rankings = this.models.map(model => {
      const stats = modelStats[model.id];
      const avgResponseTime = stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
        : 999999;
      const avgLength = stats.lengths.length > 0
        ? stats.lengths.reduce((a, b) => a + b, 0) / stats.lengths.length
        : 0;

      // Calculate score (lower response time is better, higher length is better, lower errors is better)
      const timeScore = Math.max(0, 5 - (avgResponseTime / 1000));
      const lengthScore = Math.min(5, avgLength / 100);
      const errorScore = Math.max(0, 5 - stats.errors);
      const score = timeScore + lengthScore + errorScore;

      return {
        model,
        avgResponseTime,
        avgLength,
        errorCount: stats.errors,
        score
      };
    }).sort((a, b) => b.score - a.score);

    return {
      rankings,
      testResults: modelStats
    };
  }
}

// Export a singleton instance
export const llamaService = new LlamaAPIService();
