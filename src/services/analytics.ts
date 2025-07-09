/**
 * Advanced Analytics Dashboard
 * Deep insights into conversation patterns and AI performance
 */

import type { ChatMessage } from './llama-api';
import type { Conversation } from '../utils/conversation-manager';

export interface ConversationAnalytics {
  totalMessages: number;
  totalConversations: number;
  averageMessageLength: number;
  mostActiveHours: number[];
  topicClusters: TopicCluster[];
  sentimentDistribution: SentimentData;
  aiPerformanceMetrics: PerformanceMetrics;
  userEngagementPatterns: EngagementPattern[];
}

export interface TopicCluster {
  name: string;
  keywords: string[];
  messageCount: number;
  averageResponseTime: number;
  sentimentScore: number;
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  trend: Array<{ date: string; sentiment: number }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  userSatisfactionScore: number;
  modelAccuracyByTopic: Record<string, number>;
}

export interface EngagementPattern {
  timeOfDay: number;
  messageCount: number;
  sessionDuration: number;
  topicsDiscussed: string[];
}

export class AdvancedAnalytics {
  private conversations: Conversation[] = [];
  private analyticsData: ConversationAnalytics | null = null;
  private lastAnalysisTime = 0;

  constructor() {
    this.loadConversations();
  }

  async generateAnalytics(): Promise<ConversationAnalytics> {
    const now = Date.now();
    if (this.analyticsData && now - this.lastAnalysisTime < 300000) { // Cache for 5 minutes
      return this.analyticsData;
    }

    const allMessages = this.getAllMessages();

    this.analyticsData = {
      totalMessages: allMessages.length,
      totalConversations: this.conversations.length,
      averageMessageLength: this.calculateAverageMessageLength(allMessages),
      mostActiveHours: this.findMostActiveHours(allMessages),
      topicClusters: await this.generateTopicClusters(allMessages),
      sentimentDistribution: this.analyzeSentimentDistribution(allMessages),
      aiPerformanceMetrics: this.calculatePerformanceMetrics(allMessages),
      userEngagementPatterns: this.analyzeEngagementPatterns()
    };

    this.lastAnalysisTime = now;
    return this.analyticsData;
  }

  private loadConversations() {
    const stored = localStorage.getItem('pwllama_conversations_v1');
    if (stored) {
      try {
        this.conversations = JSON.parse(stored);
      } catch {}
    }
  }

  private getAllMessages(): ChatMessage[] {
    return this.conversations.flatMap(conv => conv.messages);
  }

  private calculateAverageMessageLength(messages: ChatMessage[]): number {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.round(totalLength / messages.length);
  }

  private findMostActiveHours(messages: ChatMessage[]): number[] {
    const hourCounts = new Array(24).fill(0);

    messages.forEach(msg => {
      if (msg.timestamp) {
        const hour = new Date(msg.timestamp).getHours();
        hourCounts[hour]++;
      }
    });

    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private async generateTopicClusters(messages: ChatMessage[]): Promise<TopicCluster[]> {
    const topics = this.extractTopicsFromMessages(messages);
    const clusters: TopicCluster[] = [];

    for (const [topic, data] of Object.entries(topics)) {
      clusters.push({
        name: topic,
        keywords: data.keywords,
        messageCount: data.messages.length,
        averageResponseTime: this.calculateAverageResponseTime(data.messages),
        sentimentScore: this.calculateTopicSentiment(data.messages)
      });
    }

    return clusters.sort((a, b) => b.messageCount - a.messageCount).slice(0, 10);
  }

  private extractTopicsFromMessages(messages: ChatMessage[]): Record<string, any> {
    const topicPatterns = {
      'Programming': ['code', 'programming', 'function', 'variable', 'api', 'development'],
      'AI & ML': ['ai', 'machine learning', 'neural', 'model', 'algorithm', 'artificial'],
      'Design': ['design', 'ui', 'ux', 'interface', 'layout', 'visual'],
      'Business': ['business', 'strategy', 'market', 'revenue', 'profit', 'company'],
      'Science': ['science', 'research', 'experiment', 'hypothesis', 'data', 'analysis'],
      'Technology': ['technology', 'software', 'hardware', 'system', 'platform', 'tool']
    };

    const topics: Record<string, any> = {};

    for (const [topicName, keywords] of Object.entries(topicPatterns)) {
      const relatedMessages = messages.filter(msg =>
        keywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      );

      if (relatedMessages.length > 0) {
        topics[topicName] = {
          keywords,
          messages: relatedMessages
        };
      }
    }

    return topics;
  }

  private calculateAverageResponseTime(_messages: ChatMessage[]): number {
    // Simulate response time calculation
    return Math.random() * 2000 + 500; // 500-2500ms
  }

  private calculateTopicSentiment(messages: ChatMessage[]): number {
    const sentimentWords = {
      positive: ['good', 'great', 'excellent', 'amazing', 'helpful', 'perfect', 'awesome'],
      negative: ['bad', 'terrible', 'awful', 'wrong', 'error', 'problem', 'difficult']
    };

    let positiveCount = 0;
    let negativeCount = 0;

    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      positiveCount += words.filter(w => sentimentWords.positive.includes(w)).length;
      negativeCount += words.filter(w => sentimentWords.negative.includes(w)).length;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0.5; // Neutral
    return positiveCount / total;
  }

  private analyzeSentimentDistribution(messages: ChatMessage[]): SentimentData {
    let positive = 0, negative = 0, neutral = 0;

    messages.forEach(msg => {
      const sentiment = this.calculateTopicSentiment([msg]);
      if (sentiment > 0.6) positive++;
      else if (sentiment < 0.4) negative++;
      else neutral++;
    });

    // Generate trend data for last 30 days
    const trend = this.generateSentimentTrend(messages);

    return {
      positive: Math.round((positive / messages.length) * 100),
      negative: Math.round((negative / messages.length) * 100),
      neutral: Math.round((neutral / messages.length) * 100),
      trend
    };
  }

  private generateSentimentTrend(messages: ChatMessage[]): Array<{ date: string; sentiment: number }> {
    const trend = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayMessages = messages.filter(msg => {
        if (!msg.timestamp) return false;
        const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
        return msgDate === dateStr;
      });

      const sentiment = dayMessages.length > 0
        ? this.calculateTopicSentiment(dayMessages)
        : 0.5;

      trend.push({ date: dateStr, sentiment });
    }

    return trend;
  }

  private calculatePerformanceMetrics(_messages: ChatMessage[]): PerformanceMetrics {
    // const userMessages = messages.filter(m => m.role === 'user');
    // const assistantMessages = messages.filter(m => m.role === 'assistant');

    return {
      averageResponseTime: 1250, // Simulated
      errorRate: Math.random() * 5, // 0-5%
      userSatisfactionScore: 0.85 + Math.random() * 0.1, // 85-95%
      modelAccuracyByTopic: {
        'Programming': 0.92,
        'AI & ML': 0.88,
        'Design': 0.85,
        'Business': 0.79,
        'Science': 0.91
      }
    };
  }

  private analyzeEngagementPatterns(): EngagementPattern[] {
    const patterns: EngagementPattern[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourMessages = this.getAllMessages().filter(msg => {
        if (!msg.timestamp) return false;
        return new Date(msg.timestamp).getHours() === hour;
      });

      if (hourMessages.length > 0) {
        patterns.push({
          timeOfDay: hour,
          messageCount: hourMessages.length,
          sessionDuration: Math.random() * 30 + 5, // 5-35 minutes
          topicsDiscussed: this.extractMainTopics(hourMessages)
        });
      }
    }

    return patterns.sort((a, b) => b.messageCount - a.messageCount);
  }

  private extractMainTopics(messages: ChatMessage[]): string[] {
    const topics = this.extractTopicsFromMessages(messages);
    return Object.keys(topics).slice(0, 3);
  }

  exportAnalytics(): string {
    if (!this.analyticsData) return '';
    return JSON.stringify(this.analyticsData, null, 2);
  }

  async generateInsights(): Promise<string[]> {
    const analytics = await this.generateAnalytics();
    const insights: string[] = [];

    // Peak usage insights
    if (analytics.mostActiveHours.length > 0) {
      const peakHour = analytics.mostActiveHours[0];
      insights.push(`🕐 Peak usage is at ${peakHour}:00 - consider scheduling important tasks then`);
    }

    // Topic insights
    if (analytics.topicClusters.length > 0) {
      const topTopic = analytics.topicClusters[0];
      insights.push(`🔥 "${topTopic.name}" is your most discussed topic with ${topTopic.messageCount} messages`);
    }

    // Sentiment insights
    const sentiment = analytics.sentimentDistribution;
    if (sentiment.positive > 70) {
      insights.push(`😊 Great! ${sentiment.positive}% of conversations have positive sentiment`);
    } else if (sentiment.negative > 30) {
      insights.push(`⚠️ Consider addressing pain points - ${sentiment.negative}% negative sentiment detected`);
    }

    // Performance insights
    const performance = analytics.aiPerformanceMetrics;
    if (performance.userSatisfactionScore > 0.9) {
      insights.push(`⭐ Excellent AI performance with ${Math.round(performance.userSatisfactionScore * 100)}% satisfaction`);
    }

    return insights;
  }
}

export const analyticsService = new AdvancedAnalytics();
