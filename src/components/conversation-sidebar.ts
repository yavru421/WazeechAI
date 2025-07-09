import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { conversationManager, type Conversation } from '../utils/conversation-manager';

import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@customElement('conversation-sidebar')
export class ConversationSidebar extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) selectedId = '';
  @state() private conversations: Conversation[] = [];
  @state() private search = '';

  static styles = css`
    .sidebar {
      width: 320px;
      max-width: 100vw;
      padding: 1rem;
      background: var(--sl-color-neutral-0, #fff);
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .header {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search {
      margin-bottom: 0.5rem;
    }
    .list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.25rem;
      border-radius: 6px;
      cursor: pointer;
      background: none;
      border: none;
      text-align: left;
      transition: background 0.15s;
    }
    .item.selected {
      background: var(--sl-color-primary-100);
    }
    .item:hover {
      background: var(--sl-color-primary-50);
    }
    .item .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .actions {
      display: flex;
      gap: 0.25rem;
    }
    .footer {
      margin-top: 1rem;
      display: flex;
      gap: 0.5rem;
    }
  `;

  async firstUpdated() {
    await this.refresh();
  }

  async refresh() {
    this.conversations = await (this.search
      ? conversationManager.search(this.search)
      : conversationManager.getAll());
  }

  render() {
    return html`
      <sl-drawer label="Conversations" ?open=${this.open} placement="start" @sl-after-hide=${() => this.dispatchEvent(new CustomEvent('close'))}>
        <div class="sidebar">
          <div class="header">
            <sl-icon name="chat"></sl-icon> Conversations
          </div>
          <sl-input class="search" placeholder="Search..." clearable .value=${this.search} @sl-input=${(e: any) => { this.search = e.target.value; this.refresh(); }}></sl-input>
          <div class="list">
            ${this.conversations.map(conv => html`
              <button class="item${conv.id === this.selectedId ? ' selected' : ''}" @click=${() => this.select(conv.id)}>
                <span class="name">${conv.name}</span>
                <div class="actions">
                  <sl-button size="small" variant="text" circle title="Rename" @click=${(e: Event) => { e.stopPropagation(); this.rename(conv.id); }}><sl-icon name="edit"></sl-icon></sl-button>
                  <sl-button size="small" variant="text" circle title="Delete" @click=${(e: Event) => { e.stopPropagation(); this.delete(conv.id); }}><sl-icon name="trash"></sl-icon></sl-button>
                  <sl-button size="small" variant="text" circle title="Export" @click=${(e: Event) => { e.stopPropagation(); this.export(conv.id); }}><sl-icon name="download"></sl-icon></sl-button>
                </div>
              </button>
            `)}
          </div>
          <div class="footer">
            <sl-button variant="primary" @click=${() => this.create()}>New Chat</sl-button>
            <sl-button variant="default" @click=${() => this.import()}>Import</sl-button>
          </div>
        </div>
      </sl-drawer>
    `;
  }

  private async select(id: string) {
    this.dispatchEvent(new CustomEvent('select', { detail: id }));
  }
  private async create() {
    const conv = await conversationManager.create();
    await this.refresh();
    this.dispatchEvent(new CustomEvent('select', { detail: conv.id }));
  }
  private async rename(id: string) {
    const name = prompt('Rename conversation:');
    if (name) {
      await conversationManager.rename(id, name);
      await this.refresh();
    }
  }
  private async delete(id: string) {
    if (confirm('Delete this conversation?')) {
      await conversationManager.delete(id);
      await this.refresh();
      this.dispatchEvent(new CustomEvent('select', { detail: '' }));
    }
  }
  private async export(id: string) {
    const data = await conversationManager.export(id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pwllama-conversation.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  private async import() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const text = await input.files[0].text();
        await conversationManager.import(text);
        await this.refresh();
      }
    };
    input.click();
  }
}
