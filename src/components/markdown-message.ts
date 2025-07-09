import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Use marked for markdown parsing
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('bash', bash);

@customElement('markdown-message')
export class MarkdownMessage extends LitElement {
  @property({ type: String }) content = '';

  static styles = css`
    :host {
      display: block;
      font-size: 1.05rem;
      line-height: 1.6;
      word-break: break-word;
    }
    :host .markdown-body {
      color: #181818 !important;
      background: #fff !important;
      font-weight: 600;
    }
    @media (prefers-color-scheme: dark) {
      :host .markdown-body {
        color: #fff !important;
        background: #222 !important;
        font-weight: 600;
      }
    }
    pre, code {
      font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
      font-size: 0.98em;
      background: #181c20;
      color: #f8f8f2;
      border-radius: 6px;
      padding: 0.2em 0.4em;
    }
    pre {
      padding: 1em;
      overflow-x: auto;
      margin: 0.5em 0;
      background: #181c20;
      border-radius: 8px;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 0.5em;
      right: 0.5em;
      background: #222;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 0.2em 0.6em;
      font-size: 0.9em;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .copy-btn:hover {
      opacity: 1;
    }
    blockquote {
      border-left: 4px solid #e1477e;
      margin: 0.5em 0;
      padding-left: 1em;
      color: #666;
      background: #f8f8fa;
      border-radius: 4px;
    }
    table {
      border-collapse: collapse;
      margin: 0.5em 0;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.3em 0.7em;
    }
    ul, ol {
      margin: 0.5em 0 0.5em 1.5em;
    }
    a {
      color: #e1477e;
      text-decoration: underline;
    }
  `;

  firstUpdated() {
    this.highlightAll();
  }
  updated() {
    this.highlightAll();
  }

  highlightAll() {
    this.updateComplete.then(() => {
      this.renderRoot.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    });
  }

  render() {
    // Add copy buttons to code blocks
    const renderer = new marked.Renderer();
    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
      const highlighted = lang && hljs.getLanguage(lang)
        ? hljs.highlight(text, { language: lang }).value
        : hljs.highlightAuto(text).value;
      return `<pre><code class="hljs ${lang ?? ''}">${highlighted}</code><button class='copy-btn' onclick='navigator.clipboard.writeText(${JSON.stringify(text)})'>Copy</button></pre>`;
    };
    const htmlContent = marked.parse(this.content, { renderer }) as string;
    return html`<div class="markdown-body">${unsafeHTML(htmlContent)}</div>`;
  }
}
