import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('prompt-library')
export class PromptLibrary extends LitElement {
  @property({ type: Array }) prompts: Array<{ title: string; content: string; persona?: string }> = [];
  @state() private search = '';
  @state() private showAddPrompt = false;
  @state() private newPromptTitle = '';
  @state() private newPromptContent = '';

  static styles = css`
    .library-root {
      padding: 1rem;
      background: var(--sl-color-neutral-0, #fff);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      max-width: 350px;
      min-width: 250px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .prompt-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }
    .prompt-item {
      background: var(--sl-color-neutral-100, #f5f5f5);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .prompt-item:hover {
      background: var(--sl-color-primary-100, #e0e0ff);
    }
    .add-btn {
      align-self: flex-end;
    }
    .search-input {
      width: 100%;
    }
  `;

  get filteredPrompts() {
    const q = this.search.toLowerCase();
    return this.prompts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }

  private addPrompt() {
    if (this.newPromptTitle.trim() && this.newPromptContent.trim()) {
      this.prompts = [
        { title: this.newPromptTitle, content: this.newPromptContent },
        ...this.prompts
      ];
      this.newPromptTitle = '';
      this.newPromptContent = '';
      this.showAddPrompt = false;
      this.dispatchEvent(new CustomEvent('prompts-changed', { detail: this.prompts }));
    }
  }

  render() {
    return html`
      <div class="library-root">
        <sl-input class="search-input" placeholder="Search prompts..." .value=${this.search} @input=${(e: any) => this.search = e.target.value}></sl-input>
        <div class="prompt-list">
          ${this.filteredPrompts.map(p => html`
            <div class="prompt-item" @click=${() => this.dispatchEvent(new CustomEvent('select-prompt', { detail: p }))}>
              <b>${p.title}</b><br />
              <span style="font-size: 0.95em; color: #666;">${p.content.slice(0, 60)}${p.content.length > 60 ? '...' : ''}</span>
            </div>
          `)}
        </div>
        ${this.showAddPrompt ? html`
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <sl-input placeholder="Prompt title" .value=${this.newPromptTitle} @input=${(e: any) => this.newPromptTitle = e.target.value}></sl-input>
            <sl-textarea placeholder="Prompt content" .value=${this.newPromptContent} @input=${(e: any) => this.newPromptContent = e.target.value}></sl-textarea>
            <div style="display: flex; gap: 0.5rem;">
              <sl-button size="small" variant="primary" @click=${this.addPrompt}>Add</sl-button>
              <sl-button size="small" variant="default" @click=${() => this.showAddPrompt = false}>Cancel</sl-button>
            </div>
          </div>
        ` : html`
          <sl-button class="add-btn" size="small" variant="default" @click=${() => this.showAddPrompt = true}>+ Add Prompt</sl-button>
        `}
      </div>
    `;
  }
}
