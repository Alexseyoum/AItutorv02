import { Message } from "@/lib/types";

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ContextOptions {
  maxMessages?: number;
  maxTokens?: number;
  includeSummary?: boolean;
  systemPrompt?: string;
}

export class ConversationContextManager {
  /**
   * Estimates token count for text (rough approximation)
   * English: ~4 characters per token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Simple sliding window approach - recommended starting point
   */
  getFixedWindow(messages: Message[], maxMessages: number = 10): ConversationMessage[] {
    const recentMessages = messages.slice(-maxMessages);
    
    return recentMessages.map(msg => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content
    }));
  }

  /**
   * Token-aware windowing - most efficient for cost control
   */
  getTokenAwareContext(
    messages: Message[], 
    maxTokens: number = 2000,
    systemPrompt?: string
  ): ConversationMessage[] {
    const contextMessages: ConversationMessage[] = [];
    let tokenCount = 0;

    // Reserve tokens for system prompt if provided
    if (systemPrompt) {
      const systemTokens = this.estimateTokens(systemPrompt);
      if (systemTokens < maxTokens) {
        contextMessages.push({ role: "system", content: systemPrompt });
        tokenCount += systemTokens;
      }
    }

    // Work backwards from most recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (tokenCount + messageTokens > maxTokens) break;
      
      contextMessages.unshift({
        role: message.type === "user" ? "user" : "assistant",
        content: message.content
      });
      
      tokenCount += messageTokens;
    }

    return contextMessages;
  }

  /**
   * Smart context with conversation summary for very long chats
   */
  async getSmartContext(
    messages: Message[], 
    options: ContextOptions = {}
  ): Promise<ConversationMessage[]> {
    const {
      maxMessages = 10,
      maxTokens = 2000,
      systemPrompt
    } = options;

    // For short conversations, use simple windowing
    if (messages.length <= maxMessages) {
      return this.getTokenAwareContext(messages, maxTokens, systemPrompt);
    }

    // For longer conversations, keep recent context + summary
    const recentMessages = messages.slice(-5);
    const olderMessages = messages.slice(0, -5);
    
    const summary = this.generateConversationSummary(olderMessages);
    const context: ConversationMessage[] = [];

    if (systemPrompt) {
      context.push({ role: "system", content: systemPrompt });
    }

    // Add summary as system message
    context.push({ 
      role: "system", 
      content: `Previous conversation summary: ${summary}` 
    });

    // Add recent messages
    context.push(...this.getFixedWindow(recentMessages, 5));

    return context;
  }

  /**
   * Generate a summary of conversation history
   */
  private generateConversationSummary(messages: Message[]): string {
    if (messages.length === 0) return "No previous conversation.";

    const topics = new Set<string>();
    let userQuestions = 0;
    let aiResponses = 0;

    messages.forEach(msg => {
      if (msg.type === "user") {
        userQuestions++;
        // Extract potential topics from user messages
        const words = msg.content.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 4 && !['what', 'how', 'why', 'when', 'where'].includes(word)) {
            topics.add(word);
          }
        });
      } else {
        aiResponses++;
      }
    });

    const topicList = Array.from(topics).slice(0, 3).join(', ');
    return `Discussed topics: ${topicList}. User asked ${userQuestions} questions, AI provided ${aiResponses} responses.`;
  }

  /**
   * Get optimized context based on conversation characteristics
   */
  getOptimizedContext(
    messages: Message[],
    options: ContextOptions = {}
  ): ConversationMessage[] {
    const messageCount = messages.length;
    
    // Short conversations: use all messages
    if (messageCount <= 5) {
      return this.getFixedWindow(messages, messageCount);
    }
    
    // Medium conversations: use sliding window
    if (messageCount <= 15) {
      return this.getFixedWindow(messages, options.maxMessages || 8);
    }
    
    // Long conversations: use token-aware windowing
    return this.getTokenAwareContext(
      messages, 
      options.maxTokens || 1500,
      options.systemPrompt
    );
  }
}

// Export singleton instance
export const contextManager = new ConversationContextManager();