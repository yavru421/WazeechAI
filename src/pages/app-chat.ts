import { LitElement, css, html } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { llamaService, type ChatMessage } from '../services/llama-api';
import '../components/markdown-message';
import { conversationManager, type Conversation } from '../utils/conversation-manager';
import '../components/conversation-sidebar';
import '../components/prompt-library';
import { voiceService } from '../services/voice-service';
import { smartSuggestionsEngine, type SmartSuggestion } from '../services/smart-suggestions';
import { analyticsService, type ConversationAnalytics } from '../services/analytics';
import { dynamicThemeEngine, type DynamicTheme } from '../services/dynamic-themes';
import { type ProcessedFile } from '../services/file-handling';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';

import { styles } from '../styles/shared-styles';

@customElement('app-chat')
export class AppChat extends LitElement {
  @property() message = 'Wazi Chat';

  @state() private apiKey = '';
  @state() private isConfigured = false;
  @state() private selectedModel = 'Llama-3.3-70B-Instruct'; // Model ID remains for API compatibility
  @state() private currentMessage = '';
  @state() private isLoading = false;
  @state() private isStreaming = false;
  @state() private streamingContent = '';
  @state() private error = '';
  @state() private showApiKeyInput = false;
  @state() private showSidebar = false;
  @state() private showSettingsModal = false;
  @state() private temperature = 0.7;
  @state() private systemPrompt = '';
  @state() private persona = '';
  @state() private conversations: Conversation[] = [];
  @state() private currentConvId = '';
  @state() private testResults: any = null;
  @state() private benchmarkResults: any = null;
  @state() private showPromptLibrary = false;
  @state() private promptLibrary: Array<{ title: string; content: string; persona?: string }> = [
    { title: 'Wazi', content: 'You are Wazi, a helpful, friendly AI assistant.' },
    { title: 'Code Explainer', content: 'Explain code step by step in simple terms.' },
    { title: 'Creative Writer', content: 'Write creative, engaging stories or poems.' }
  ];
  @state() private uploadedImageUrl: string | null = null;
  @state() private isListening = false;
  @state() private voiceTranscript = '';
  @state() private smartSuggestions: SmartSuggestion[] = [];
  @state() private showAnalytics = false;
  @state() private analyticsData: ConversationAnalytics | null = null;
  @state() private showThemeSelector = false;
  @state() private availableThemes: DynamicTheme[] = [];
  @state() private currentTheme: DynamicTheme | null = null;
  @state() private userPreferences: any = {};
  @state() private processedFiles: ProcessedFile[] = [];
  @state() private showFileAnalysis = false;
  @state() private isDragOver = false;
  @state() private selectedFile: ProcessedFile | null = null;

  static styles = [
    styles,
    css`
      :host {
        display: block;
        height: 100vh;
        --chat-bg: var(--sl-color-neutral-50);
      }
      .chat-root {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--chat-bg);
      }
      .chat-main {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        max-width: 700px;
        margin: 0 auto;
        width: 100%;
        padding: 0 0 0.5rem 0;
      }
      .messages-scroll {
        flex: 1 1 0;
        overflow-y: auto;
        padding: 1.5rem 0.5rem 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .bubble-row {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
      }
      .bubble-row.user {
        flex-direction: row-reverse;
      }
      .bubble {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: 1.25rem;
        font-size: 1.05rem;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        word-break: break-word;
        white-space: pre-wrap;
      }
      .bubble.user {
        background: var(--sl-color-primary-200);
        color: var(--sl-color-primary-900);
        border-bottom-right-radius: 0.5rem;
      }
      .bubble.assistant {
        background: white;
        color: var(--sl-color-neutral-900);
        border-bottom-left-radius: 0.5rem;
      }
      .bubble.streaming {
        background: var(--sl-color-success-100);
        border: 2px dashed var(--sl-color-success-300);
      }
      .avatar {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        background: var(--sl-color-primary-100);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--sl-color-primary-700);
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .avatar.assistant {
        background: var(--sl-color-neutral-200);
        color: var(--sl-color-primary-700);
      }
      .input-bar {
        position: sticky;
        bottom: 0;
        left: 0;
        width: 100%;
        background: var(--chat-bg);
        padding: 0.75rem 0.5rem 0.75rem 0.5rem;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.03);
        z-index: 10;
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
      }
      .input-bar sl-textarea {
        flex: 1;
        min-height: 2.5rem;
        max-height: 7rem;
      }
      .input-bar .send-btns {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .drag-over {
        background: rgba(var(--sl-color-primary-600), 0.1) !important;
        border: 2px dashed var(--sl-color-primary-600) !important;
      }
      .file-analysis-btn {
        position: fixed;
        bottom: 100px;
        right: 20px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.5rem 0 0.5rem;
        max-width: 700px;
        margin: 0 auto;
        width: 100%;
      }
      .chat-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--sl-color-primary-800);
        letter-spacing: 0.01em;
      }
      .settings-btn {
        margin-left: 0.5rem;
      }
      @media (max-width: 700px) {
        .chat-main, .chat-header {
          max-width: 100vw;
        }
      }
    `
  ];

  async firstUpdated() {
    this.isConfigured = llamaService.isConfigured();
    this.apiKey = llamaService.getApiKey() || '';
    // Load advanced settings from localStorage
    const adv = localStorage.getItem('pwllama_advanced_settings');
    if (adv) {
      try {
        const s = JSON.parse(adv);
        if (s.selectedModel) this.selectedModel = s.selectedModel;
        if (s.temperature) this.temperature = s.temperature;
        if (s.systemPrompt) this.systemPrompt = s.systemPrompt;
        if (s.persona) this.persona = s.persona;
      } catch {}
    }
    // Load prompt library from localStorage
    const lib = localStorage.getItem('pwllama_prompt_library');
    if (lib) {
      try {
        this.promptLibrary = JSON.parse(lib);
      } catch {}
    }

    // Initialize cutting-edge features
    await this.initializeAdvancedFeatures();

    // Initialize file handling
    await this.initializeFileHandling();

    await this.loadConversations();
    if (!this.currentConvId && this.conversations.length) {
      this.currentConvId = this.conversations[0].id;
    }
    if (!this.currentConvId) {
      const conv = await conversationManager.create('New Chat');
      this.currentConvId = conv.id;
      await this.loadConversations();
    }
    if (this.isConfigured && this.messages.length === 0) {
      // Don't add automatic system messages as they can interfere with API validation
      // this.addSystemMessage('Welcome! I\'m ready to help you with any questions or tasks.');
    }
  }

  private async initializeAdvancedFeatures() {
    // Initialize voice service listeners
    window.addEventListener('voice-interim', (e: any) => {
      this.voiceTranscript = e.detail;
      this.requestUpdate();
    });

    // Generate initial smart suggestions
    if (this.messages.length > 0) {
      this.smartSuggestions = await smartSuggestionsEngine.generateSuggestions(this.messages);
    }

    // Load current theme
    this.currentTheme = dynamicThemeEngine.getCurrentTheme();
    this.availableThemes = dynamicThemeEngine.getThemeHistory();

    // Auto-generate theme based on conversation
    if (this.messages.length > 3) {
      const newTheme = await dynamicThemeEngine.generateThemeFromConversation(this.messages);
      this.availableThemes = [newTheme, ...this.availableThemes];
    }
  }

  private async initializeFileHandling() {
    // Listen for processed files and send preview to chat
    document.addEventListener('file-processed', (e: any) => {
      const processedFile = e.detail as ProcessedFile;
      // Compose a preview message for the chat
      const preview = processedFile.content.substring(0, 1000) + (processedFile.content.length > 1000 ? '...' : '');
      const fileMessage = `[File: ${processedFile.file.name}]

${preview}`;
      this.currentMessage = fileMessage;
      this.requestUpdate();
    });

    // Set up event listeners for file handling
    document.addEventListener('file-processed', (e: any) => {
      const processedFile = e.detail as ProcessedFile;
      this.processedFiles = [...this.processedFiles, processedFile];
      this.showFileAnalysisToast(processedFile);
    });

    document.addEventListener('file-error', (e: any) => {
      const { file, error } = e.detail;
      console.error(`Error processing file ${file.name}:`, error);
      // Show error notification
      this.showNotification(`Error processing file ${file.name}`, 'danger');
    });

    // Set up drag and drop visual feedback
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.isDragOver = true;
    });

    document.addEventListener('dragleave', (e) => {
      if (!document.body.contains(e.relatedTarget as Node)) {
        this.isDragOver = false;
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.isDragOver = false;
    });
  }

  private showFileAnalysisToast(processedFile: ProcessedFile) {
    const toast = Object.assign(document.createElement('sl-alert'), {
      variant: 'primary',
      closable: true,
      duration: 5000,
      innerHTML: `
        <sl-icon slot="icon" name="file-earmark-text"></sl-icon>
        <strong>File Processed: ${processedFile.file.name}</strong><br>
        ${processedFile.analysis.contentSummary}
        <br><br>
        <sl-button size="small" variant="text" onclick="document.querySelector('app-chat').showFileAnalysisPanel('${processedFile.file.name}')">
          View Analysis
        </sl-button>
      `
    });
    document.body.appendChild(toast);
    toast.toast();
  }

  private showNotification(message: string, variant: 'primary' | 'success' | 'danger' = 'primary') {
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant,
      closable: true,
      duration: 4000,
      innerHTML: `<sl-icon slot="icon" name="info-circle"></sl-icon>${message}`
    });
    document.body.appendChild(alert);
    alert.toast();
  }

  // File analysis functionality available through event handlers

  private addFileToChat(processedFile: ProcessedFile) {
    // Add file content as a user message
    const fileMessage = `[File: ${processedFile.file.name}]\n\n${processedFile.analysis.contentSummary}\n\nContent preview:\n${processedFile.content.substring(0, 500)}${processedFile.content.length > 500 ? '...' : ''}`;

    this.currentMessage = fileMessage;
    this.showFileAnalysis = false;
  }

  private async askAboutFile(processedFile: ProcessedFile) {
    // Ask AI to analyze the file
    const question = `Please analyze this file and provide insights:\n\nFile: ${processedFile.file.name}\nType: ${processedFile.analysis.fileType}\nSummary: ${processedFile.analysis.contentSummary}\n\nContent:\n${processedFile.content.substring(0, 1000)}${processedFile.content.length > 1000 ? '...' : ''}`;

    this.currentMessage = question;
    this.showFileAnalysis = false;
    await this.handleSendMessage();
  }

  get messages(): ChatMessage[] {
    const conv = this.conversations.find(c => c.id === this.currentConvId);
    // Ensure all messages have string content
    if (!conv) return [];
    return conv.messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));
  }

  async loadConversations() {
    this.conversations = await conversationManager.getAll();
    this.requestUpdate('messages');
  }

  // Removed addSystemMessage method as it was causing API validation issues

  private async addUserMessage(message: ChatMessage) {
    if (!this.currentConvId) return;
    await conversationManager.addMessage(this.currentConvId, message);
    await this.loadConversations();
    this.requestUpdate('messages');
  }

  private async addAssistantMessage(content: string) {
    if (!this.currentConvId) return;
    await conversationManager.addMessage(this.currentConvId, {
      role: 'assistant', // Keep as 'assistant' for type safety
      content,
      timestamp: new Date()
    });
    await this.loadConversations();
    this.requestUpdate('messages');

    // Auto-speak response if voice is enabled
    if (voiceService.isSupported && this.userPreferences?.autoSpeak) {
      await this.speakResponse(content);
    }

    // Refresh smart suggestions after AI response
    await this.refreshSmartSuggestions();

    // Auto-generate theme if conversation reaches certain length
    if (this.messages.length > 0 && this.messages.length % 10 === 0) {
      await this.generateNewTheme();
    }
  }

  private async handleApiKeySubmit() {
    if (this.apiKey.trim()) {
      llamaService.setApiKey(this.apiKey.trim());
      this.isConfigured = true;
      this.showApiKeyInput = false;
      // Don't add system message that could interfere with API validation
      // await this.addSystemMessage('API key configured successfully! You can now start chatting.');
    }
  }

  private getValidChatHistory(): { role: 'user' | 'assistant'; content: string }[] {
    // Only user/assistant, non-empty, and starts with user
    let filtered = this.messages
      .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content && msg.content.trim())
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: String(msg.content).trim() }));
    if (filtered.length > 0 && filtered[0].role === 'assistant') {
      filtered = filtered.slice(1);
    }
    return filtered;
  }

  private async handleSendMessage() {
    if (!this.currentMessage.trim() && !this.uploadedImageUrl || !this.isConfigured) return;
    let messageContent = this.currentMessage.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    if (this.uploadedImageUrl) {
      userMessage.imageUrl = this.uploadedImageUrl;
    }
    await this.addUserMessage(userMessage);
    this.currentMessage = '';
    this.uploadedImageUrl = null;
    this.isLoading = true;
    this.error = '';
    try {
      const response = await llamaService.chat(
        this.getValidChatHistory(),
        this.selectedModel,
        { maxTokens: 512, temperature: this.temperature }
      );
      await this.addAssistantMessage(response.content);
    } catch (error) {
      this.error = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    } finally {
      this.isLoading = false;
    }
  }

  private async handleStreamingChat() {
    if (!this.currentMessage.trim() && !this.uploadedImageUrl || !this.isConfigured) return;
    this.currentMessage = '';
    this.isStreaming = true;
    this.streamingContent = '';
    this.error = '';
    try {
      const stream = llamaService.chatStream(
        this.getValidChatHistory(),
        this.selectedModel,
        { maxTokens: 512, temperature: this.temperature }
      );
      for await (const chunk of stream) {
        if (chunk.isComplete) {
          await this.addAssistantMessage(this.streamingContent);
          this.streamingContent = '';
          break;
        } else {
          this.streamingContent += chunk.text;
          this.requestUpdate();
        }
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    } finally {
      this.isStreaming = false;
    }
  }

  private saveAdvancedSettings() {
    localStorage.setItem('pwllama_advanced_settings', JSON.stringify({
      selectedModel: this.selectedModel,
      temperature: this.temperature,
      systemPrompt: this.systemPrompt,
      persona: this.persona
    }));
  }

  private renderSettingsModal() {
    return html`
      <sl-dialog label="Advanced Settings" .open=${this.showSettingsModal} @sl-after-hide=${() => this.showSettingsModal = false}>
        <div style="display: flex; flex-direction: column; gap: 1.2rem; min-width: 320px;">
          <div>
            <label>Model</label>
            <sl-select .value=${this.selectedModel} @sl-change=${(e: any) => { this.selectedModel = e.target.value; }}>
              ${llamaService.models.map(m => html`<sl-option value="${m.id}">${m.name}</sl-option>`) }
            </sl-select>
          </div>
          <div>
            <label>Temperature: <b>${this.temperature}</b></label>
            <sl-range min="0" max="1" step="0.01" .value=${this.temperature} @sl-input=${(e: any) => { this.temperature = parseFloat(e.target.value); }}></sl-range>
          </div>
          <div>
            <label>System Prompt</label>
            <sl-textarea .value=${this.systemPrompt} @input=${(e: any) => { this.systemPrompt = e.target.value; }} rows="2"></sl-textarea>
          </div>
          <div>
            <label>Persona (optional)</label>
            <sl-input .value=${this.persona} @input=${(e: any) => { this.persona = e.target.value; }}></sl-input>
          </div>
        </div>
        <sl-button slot="footer" variant="primary" @click=${() => { this.saveAdvancedSettings(); this.showSettingsModal = false; }}>Save</sl-button>
        <sl-button slot="footer" variant="default" @click=${() => this.showSettingsModal = false}>Cancel</sl-button>
      </sl-dialog>
    `;
  }

  private async testAllModels() {
    if (!this.isConfigured) return;

    this.isLoading = true;
    this.error = '';

    try {
      this.testResults = await llamaService.testAllModels(
        "Introduce yourself and explain what you can help with in 2-3 sentences."
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    } finally {
      this.isLoading = false;
    }
  }

  private async benchmarkModels() {
    if (!this.isConfigured) return;

    this.isLoading = true;
    this.error = '';

    try {
      this.benchmarkResults = await llamaService.benchmarkModels();
    } catch (error) {
      this.error = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    } finally {
      this.isLoading = false;
    }
  }

  // Example prompt functionality removed for now

  // Removed clearChat method as it's not needed

  private scrollToBottom() {
    this.updateComplete.then(() => {
      const container = this.shadowRoot?.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }

  private renderApiKeySection() {
    if (this.isConfigured && !this.showApiKeyInput) {
      return html`
        <div class="api-key-section">
          <sl-alert variant="success" open>
            <sl-icon slot="icon" name="check-circle"></sl-icon>
            API key is configured.
            <sl-button variant="text" size="small" @click=${() => this.showApiKeyInput = true}>
              Change API Key
            </sl-button>
          </sl-alert>
        </div>
      `;
    }

    return html`
      <div class="api-key-section">
        <sl-card>
          <div slot="header">
            <h3>API Key Configuration</h3>
          </div>

          <p>Enter your Llama API key to start chatting:</p>

          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <sl-input
              type="password"
              placeholder="Enter your Llama API key"
              .value=${this.apiKey}
              @input=${(e: any) => this.apiKey = e.target.value}
              @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleApiKeySubmit()}
              style="flex: 1"
            ></sl-input>
            <sl-button variant="primary" @click=${this.handleApiKeySubmit}>
              Configure
            </sl-button>
          </div>

          <sl-alert variant="neutral" open>
            <sl-icon slot="icon" name="info-circle"></sl-icon>
            Your API key is stored locally in your browser and never sent to our servers.
            Get your API key from the Llama API service provider.
          </sl-alert>
        </sl-card>
      </div>
    `;
  }

  private renderMessages() {
    return html`
      <div class="messages-scroll">
        ${this.messages.map(msg => html`
          <div class="bubble-row ${msg.role}">
            <div class="avatar ${msg.role}">
              ${msg.role === 'user' ? html`<sl-icon name="person"></sl-icon>` : html`<sl-icon name="robot"></sl-icon>`}
            </div>
            <div class="bubble ${msg.role}">
              ${msg.imageUrl ? html`<img src="${msg.imageUrl}" alt="user upload" style="max-width:180px; max-height:180px; display:block; margin-bottom:0.5em; border-radius:8px;" />` : ''}
              ${msg.role === 'assistant'
                ? html`<div style="font-weight:bold; color:var(--sl-color-primary-700); margin-bottom:2px;">Wazi</div><markdown-message .content=${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}></markdown-message>`
                : (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))}
            </div>
          </div>
        `)}
        ${this.isStreaming ? html`
          <div class="bubble-row assistant">
            <div class="avatar assistant">
              <sl-icon name="robot"></sl-icon>
            </div>
            <div class="bubble assistant streaming">
              <div style="font-weight:bold; color:var(--sl-color-primary-700); margin-bottom:2px;">Wazi</div>
              <sl-spinner style="--size: 12px;"></sl-spinner> <markdown-message .content=${this.streamingContent}></markdown-message>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderTestResults() {
    if (!this.testResults) return '';

    return html`
      <div class="test-results">
        <sl-divider></sl-divider>
        <h3>Model Test Results</h3>
        ${Object.entries(this.testResults).map(([modelId, result]) => {
          const model = llamaService.models.find(m => m.id === modelId);
          const hasError = 'error' in (result as any);

          return html`
            <div class="model-result">
              <div class="model-header">
                <h4>${model?.name || modelId}</h4>
                ${hasError ? html`
                  <sl-badge variant="danger">Error</sl-badge>
                ` : html`
                  <sl-badge variant="success">Success</sl-badge>
                `}
              </div>

              ${hasError ? html`
                <p style="color: var(--sl-color-danger-600);">
                  Error: ${(result as any).error}
                </p>
              ` : html`
                <p>${(result as any).content}</p>
                <div class="performance-metrics">
                  <div class="metric">
                    <sl-icon name="clock"></sl-icon>
                    <span>${(result as any).responseTime}ms</span>
                  </div>
                  <div class="metric">
                    <sl-icon name="file-text"></sl-icon>
                    <span>${(result as any).content.length} chars</span>
                  </div>
                  ${(result as any).tokens ? html`
                    <div class="metric">
                      <sl-icon name="cpu"></sl-icon>
                      <span>${(result as any).tokens} tokens</span>
                    </div>
                  ` : ''}
                </div>
              `}
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderBenchmarkResults() {
    if (!this.benchmarkResults) return '';

    return html`
      <div class="test-results">
        <sl-divider></sl-divider>
        <h3>Model Performance Rankings</h3>
        <div class="ranking-list">
          ${this.benchmarkResults.rankings.map((item: any, index: number) => html`
            <div class="ranking-item">
              <div>
                <h4>#${index + 1} ${item.model.name}</h4>
                <p style="margin: 4px 0; color: var(--sl-color-neutral-600);">
                  ${item.model.description}
                </p>
              </div>
              <div style="text-align: right;">
                <div class="metric">
                  <strong>Score: ${item.score.toFixed(1)}/12</strong>
                </div>
                <div style="font-size: 0.8em; color: var(--sl-color-neutral-600);">
                  ${item.avgResponseTime.toFixed(0)}ms avg • ${item.avgLength.toFixed(0)} chars avg
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('messages') || changedProperties.has('streamingContent')) {
      this.scrollToBottom();
    }
  }

  private handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.uploadedImageUrl = reader.result as string;
        this.requestUpdate();
      };
      reader.readAsDataURL(file);
    }
  }

  // Voice interaction methods
  private async startVoiceInput() {
    if (!voiceService.isSupported) {
      this.error = 'Voice input not supported in this browser';
      return;
    }

    try {
      this.isListening = true;
      this.voiceTranscript = '';
      const transcript = await voiceService.startListening();
      this.currentMessage = transcript;
      this.isListening = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Voice input failed';
      this.isListening = false;
    }
  }

  private stopVoiceInput() {
    voiceService.stopListening();
    this.isListening = false;
  }

  private async speakResponse(text: string) {
    try {
      await voiceService.speak(text);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  }

  // Smart suggestions methods
  private async refreshSmartSuggestions() {
    if (this.messages.length > 0) {
      this.smartSuggestions = await smartSuggestionsEngine.generateSuggestions(this.messages);
    }
  }

  private useSuggestion(suggestion: SmartSuggestion) {
    this.currentMessage = suggestion.text;
    this.requestUpdate();
  }

  // Analytics methods
  private async showAnalyticsPanel() {
    this.showAnalytics = true;
    this.analyticsData = await analyticsService.generateAnalytics();
  }

  // Theme methods
  private async generateNewTheme() {
    const newTheme = await dynamicThemeEngine.generateThemeFromConversation(this.messages);
    dynamicThemeEngine.applyTheme(newTheme);
    this.currentTheme = newTheme;
    this.availableThemes = [newTheme, ...this.availableThemes.slice(0, 9)];
  }

  private applyTheme(theme: DynamicTheme) {
    dynamicThemeEngine.applyTheme(theme);
    this.currentTheme = theme;
  }

  private generateRandomTheme() {
    const randomTheme = dynamicThemeEngine.generateRandomTheme();
    this.applyTheme(randomTheme);
    this.availableThemes = [randomTheme, ...this.availableThemes.slice(0, 9)];
  }

  private handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      import('../services/file-handling').then(({ fileHandlingService }) => {
        fileHandlingService.handleFiles(files);
      });
    }
  }

  render() {
    return html`
      <app-header></app-header>
      <div class="chat-root">
        <conversation-sidebar
          .open=${this.showSidebar}
          .selectedId=${this.currentConvId}
          @close=${() => this.showSidebar = false}
          @select=${(e: CustomEvent) => {
            this.currentConvId = e.detail;
            this.showSidebar = false;
            this.loadConversations();
          }}
        ></conversation-sidebar>
        <div class="chat-header">
          <sl-button class="settings-btn" size="small" circle @click=${() => this.showSidebar = true} title="Conversations">
            <sl-icon name="menu"></sl-icon>
          </sl-button>
          <span class="chat-title">Llama 4 Chat</span>
          <div style="display: flex; gap: 0.25rem;">
            <sl-button class="settings-btn" size="small" circle @click=${() => this.showAnalyticsPanel()} title="Analytics Dashboard">
              <sl-icon name="bar-chart"></sl-icon>
            </sl-button>
            <sl-button class="settings-btn" size="small" circle @click=${() => this.showThemeSelector = true} title="AI Themes">
              <sl-icon name="palette"></sl-icon>
            </sl-button>
            <sl-button class="settings-btn" size="small" circle @click=${() => this.showPromptLibrary = true} title="Prompt Library">
              <sl-icon name="book"></sl-icon>
            </sl-button>
            <sl-button class="settings-btn" size="small" circle @click=${() => this.showSettingsModal = true} title="Advanced Settings">
              <sl-icon name="gear"></sl-icon>
            </sl-button>
          </div>
        </div>
        ${this.renderSettingsModal()}
        ${this.showPromptLibrary ? html`
          <sl-dialog label="Prompt Library" open @sl-after-hide=${() => this.showPromptLibrary = false}>
            <prompt-library
              .prompts=${this.promptLibrary}
              @select-prompt=${(e: CustomEvent) => {
                this.currentMessage = e.detail.content;
                if (e.detail.persona) this.persona = e.detail.persona;
                this.showPromptLibrary = false;
              }}
              @prompts-changed=${(e: CustomEvent) => {
                this.promptLibrary = e.detail;
                localStorage.setItem('pwllama_prompt_library', JSON.stringify(this.promptLibrary));
              }}
            ></prompt-library>
            <sl-button slot="footer" variant="default" @click=${() => this.showPromptLibrary = false}>Close</sl-button>
          </sl-dialog>
        ` : ''}
        <!-- Analytics Dashboard Modal -->
        ${this.showAnalytics ? html`
          <sl-dialog label="📊 Advanced Analytics Dashboard" .open=${this.showAnalytics} @sl-after-hide=${() => this.showAnalytics = false} style="--width: 90vw; --height: 80vh;">
            ${this.analyticsData ? html`
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                <sl-card>
                  <div slot="header">📈 Overview</div>
                  <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--sl-color-primary-600);">
                      ${this.analyticsData.totalMessages}
                    </div>
                    <div>Total Messages</div>
                    <div style="margin-top: 1rem;">
                      <div>${this.analyticsData.totalConversations} Conversations</div>
                      <div>${this.analyticsData.averageMessageLength} avg chars/message</div>
                    </div>
                  </div>
                </sl-card>

                <sl-card>
                  <div slot="header">🕐 Peak Hours</div>
                  <div>
                    ${this.analyticsData.mostActiveHours.map(hour => html`
                      <sl-badge variant="primary">${hour}:00</sl-badge>
                    `)}
                  </div>
                </sl-card>

                <sl-card>
                  <div slot="header">😊 Sentiment Analysis</div>
                  <div>
                    <div style="margin: 0.5rem 0;">
                      <div style="display: flex; justify-content: space-between;">
                        <span>😊 Positive</span>
                        <span>${this.analyticsData.sentimentDistribution.positive}%</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span>😐 Neutral</span>
                        <span>${this.analyticsData.sentimentDistribution.neutral}%</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span>😞 Negative</span>
                        <span>${this.analyticsData.sentimentDistribution.negative}%</span>
                      </div>
                    </div>
                  </div>
                </sl-card>

                <sl-card>
                  <div slot="header">🔥 Top Topics</div>
                  <div>
                    ${this.analyticsData.topicClusters.slice(0, 5).map(topic => html`
                      <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                        <span>${topic.name}</span>
                        <sl-badge variant="neutral">${topic.messageCount}</sl-badge>
                      </div>
                    `)}
                  </div>
                </sl-card>

                <sl-card>
                  <div slot="header">⚡ AI Performance</div>
                  <div>
                    <div>Response Time: ${this.analyticsData.aiPerformanceMetrics.averageResponseTime}ms</div>
                    <div>Error Rate: ${this.analyticsData.aiPerformanceMetrics.errorRate.toFixed(1)}%</div>
                    <div>Satisfaction: ${Math.round(this.analyticsData.aiPerformanceMetrics.userSatisfactionScore * 100)}%</div>
                  </div>
                </sl-card>
              </div>
            ` : html`<sl-spinner></sl-spinner>`}
            <sl-button slot="footer" variant="default" @click=${() => this.showAnalytics = false}>Close</sl-button>
          </sl-dialog>
        ` : ''}

        <!-- AI Theme Selector Modal -->
        ${this.showThemeSelector ? html`
          <sl-dialog label="🎨 AI-Generated Themes" .open=${this.showThemeSelector} @sl-after-hide=${() => this.showThemeSelector = false}>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <sl-button variant="primary" @click=${this.generateNewTheme}>
                ✨ Generate Theme from Chat
              </sl-button>
              <sl-button variant="default" @click=${this.generateRandomTheme}>
                🎲 Random Theme
              </sl-button>
              ${this.availableThemes.map(theme => html`
                <sl-card class="theme-card" @click=${() => this.applyTheme(theme)} style="cursor: pointer; border: ${this.currentTheme?.id === theme.id ? '2px solid var(--sl-color-primary-600)' : 'none'};">
                  <div style="background: ${theme.colors.gradient}; height: 40px; border-radius: 4px; margin-bottom: 0.5rem;"></div>
                  <div style="font-weight: bold; font-size: 0.9rem;">${theme.name}</div>
                  <div style="font-size: 0.8rem; color: var(--sl-color-neutral-600);">${theme.description}</div>
                  <sl-badge variant="neutral" style="margin-top: 0.5rem;">${theme.mood}</sl-badge>
                </sl-card>
              `)}
            </div>
            <sl-button slot="footer" variant="default" @click=${() => this.showThemeSelector = false}>Close</sl-button>
          </sl-dialog>
        ` : ''}

        <div class="chat-main">
          ${this.renderApiKeySection()}
          ${this.isConfigured ? html`
            ${this.error ? html`
              <sl-alert variant="danger" open closable @sl-hide=${() => this.error = ''}>
                <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                ${this.error}
              </sl-alert>
            ` : ''}
            ${this.renderMessages()}
            <div class="input-bar">
              <sl-textarea
                class="message-input"
                placeholder="Type your message here..."
                .value=${this.currentMessage}
                @input=${(e: any) => this.currentMessage = e.target.value}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                  }
                }}
                ?disabled=${this.isLoading || this.isStreaming}
                rows="2"
              ></sl-textarea>
              <div class="send-btns">
                <sl-button
                  variant="primary"
                  @click=${this.handleSendMessage}
                  ?loading=${this.isLoading}
                  ?disabled=${!this.currentMessage.trim() || this.isStreaming}
                  size="medium"
                  circle
                  title="Send"
                >
                  <sl-icon slot="prefix" name="send"></sl-icon>
                </sl-button>
                <sl-button
                  variant="default"
                  @click=${this.handleStreamingChat}
                  ?loading=${this.isStreaming}
                  ?disabled=${!this.currentMessage.trim() || this.isLoading}
                  size="medium"
                  circle
                  title="Stream"
                >
                  <sl-icon slot="prefix" name="broadcast"></sl-icon>
                </sl-button>
                <input type="file" accept="image/*" style="display:none" id="image-upload" @change=${this.handleImageUpload.bind(this)} />
                <sl-button
                  variant="info"
                  size="medium"
                  circle
                  title="Attach Image"
                  @click=${() => this.shadowRoot?.getElementById('image-upload')?.click()}
                >
                  <sl-icon slot="prefix" name="image"></sl-icon>
                </sl-button>
                <sl-button
                  variant=${this.isListening ? 'danger' : 'success'}
                  size="medium"
                  circle
                  title=${this.isListening ? 'Stop Listening' : 'Voice Input'}
                  @click=${this.isListening ? this.stopVoiceInput : this.startVoiceInput}
                  ?disabled=${this.isLoading || this.isStreaming}
                >
                  <sl-icon slot="prefix" name=${this.isListening ? 'mic-off' : 'mic'}></sl-icon>
                </sl-button>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin: 0.5rem 0;">
              <sl-button variant="success" size="small" @click=${this.testAllModels.bind(this)} ?loading=${this.isLoading}>
                <sl-icon slot="prefix" name="robot"></sl-icon>Test All Models
              </sl-button>
              <sl-button variant="warning" size="small" @click=${this.benchmarkModels.bind(this)} ?loading=${this.isLoading}>
                <sl-icon slot="prefix" name="bar-chart"></sl-icon>Benchmark Models
              </sl-button>
            </div>
            ${this.renderTestResults()}
            ${this.renderBenchmarkResults()}
            ${this.smartSuggestions.length > 0 ? html`
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; padding: 0 0.5rem;">
                <span style="font-size: 0.9rem; color: var(--sl-color-neutral-600); align-self: center;">💡 Smart suggestions:</span>
                ${this.smartSuggestions.slice(0, 3).map(suggestion => html`
                  <sl-button
                    size="small"
                    variant="default"
                    @click=${() => this.useSuggestion(suggestion)}
                    title="${suggestion.reasoning}"
                  >
                    ${suggestion.text}
                  </sl-button>
                `)}
                <sl-button size="small" variant="text" @click=${this.refreshSmartSuggestions}>
                  <sl-icon name="arrow-clockwise"></sl-icon>
                </sl-button>
              </div>
            ` : ''}
            ${this.voiceTranscript ? html`
              <div style="padding: 0.5rem; background: var(--sl-color-primary-50); border-radius: 4px; margin: 0.5rem;">
                🎤 <em>${this.voiceTranscript}</em>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <!-- File Analysis Modal -->
        ${this.showFileAnalysis && this.selectedFile ? html`
          <sl-dialog label="📁 File Analysis" .open=${this.showFileAnalysis} @sl-after-hide=${() => this.showFileAnalysis = false} style="--width: 90vw; --height: 80vh;">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; height: 100%;">
              <div>
                <sl-card>
                  <div slot="header">📊 File Information</div>
                  <div>
                    <div style="margin: 0.5rem 0;"><strong>Name:</strong> ${this.selectedFile.file.name}</div>
                    <div style="margin: 0.5rem 0;"><strong>Type:</strong> ${this.selectedFile.analysis.fileType}</div>
                    <div style="margin: 0.5rem 0;"><strong>Size:</strong> ${(this.selectedFile.analysis.fileSize / 1024).toFixed(1)} KB</div>
                    <div style="margin: 0.5rem 0;"><strong>Processed:</strong> ${this.selectedFile.timestamp.toLocaleString()}</div>
                    ${this.selectedFile.analysis.detectedLanguage ? html`
                      <div style="margin: 0.5rem 0;"><strong>Language:</strong> ${this.selectedFile.analysis.detectedLanguage}</div>
                    ` : ''}
                    ${this.selectedFile.analysis.sentiment ? html`
                      <div style="margin: 0.5rem 0;"><strong>Sentiment:</strong>
                        <sl-badge variant=${this.selectedFile.analysis.sentiment === 'positive' ? 'success' : this.selectedFile.analysis.sentiment === 'negative' ? 'danger' : 'neutral'}>
                          ${this.selectedFile.analysis.sentiment}
                        </sl-badge>
                      </div>
                    ` : ''}
                    ${this.selectedFile.analysis.readabilityScore ? html`
                      <div style="margin: 0.5rem 0;"><strong>Readability:</strong> ${this.selectedFile.analysis.readabilityScore}/10</div>
                    ` : ''}
                  </div>
                </sl-card>

                <sl-card style="margin-top: 1rem;">
                  <div slot="header">🏷️ Keywords</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${this.selectedFile.analysis.keywords.map(keyword => html`
                      <sl-badge variant="neutral">${keyword}</sl-badge>
                    `)}
                  </div>
                </sl-card>
              </div>

              <div>
                <sl-card style="height: 100%;">
                  <div slot="header">💡 AI Insights</div>
                  <div style="height: 300px; overflow-y: auto;">
                    <div style="margin-bottom: 1rem;">
                      <strong>Summary:</strong>
                      <p>${this.selectedFile.analysis.contentSummary}</p>
                    </div>

                    <div>
                      <strong>AI Analysis:</strong>
                      <ul>
                        ${this.selectedFile.analysis.aiInsights.map(insight => html`
                          <li style="margin: 0.5rem 0;">${insight}</li>
                        `)}
                      </ul>
                    </div>
                  </div>

                  <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <sl-button variant="primary" @click=${() => this.addFileToChat(this.selectedFile!)}>
                      Add to Chat
                    </sl-button>
                    <sl-button variant="default" @click=${() => this.askAboutFile(this.selectedFile!)}>
                      Ask AI About This File
                    </sl-button>
                  </div>
                </sl-card>
              </div>
            </div>
            <sl-button slot="footer" variant="default" @click=${() => this.showFileAnalysis = false}>Close</sl-button>
          </sl-dialog>
        ` : ''}

        <!-- Drag and Drop Overlay -->
        ${this.isDragOver ? html`
          <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; text-align: center;">
            <div>
              <sl-icon name="cloud-upload" style="font-size: 4rem; display: block; margin: 0 auto 1rem;"></sl-icon>
              <div>Drop files here to analyze them</div>
              <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.8;">
                Supported: Images, Text files, JSON, Markdown, CSV
              </div>
            </div>
          </div>
        ` : ''}

        <!-- File Processing Panel -->
        ${this.processedFiles.length > 0 ? html`
          <sl-button
            variant="default"
            size="small"
            style="position: fixed; bottom: 100px; right: 20px; z-index: 1000;"
            @click=${() => this.showFileAnalysis = true}
          >
            <sl-icon slot="prefix" name="files"></sl-icon>
            ${this.processedFiles.length} File${this.processedFiles.length > 1 ? 's' : ''}
          </sl-button>
        ` : ''}

        <input type="file" style="display:none" id="file-upload" @change=${this.handleFileUpload.bind(this)} multiple />
      </div>
    `;
  }
}
