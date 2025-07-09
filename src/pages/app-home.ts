import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import { resolveRouterPath } from '../router';
import { checkAllServices, type ServiceStatus } from '../services/service-status';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import { styles } from '../styles/shared-styles';

@customElement('app-home')
export class AppHome extends LitElement {

  // For more information on using properties and state in lit
  // check out this link https://lit.dev/docs/components/properties/
  @property() message = 'Welcome to WazeechAI!';
  @property({ type: Array }) serviceStatuses: ServiceStatus[] = [];
  @property({ type: Boolean }) allReady: boolean = false;
  @property({ type: Boolean }) checking: boolean = true;

  static styles = [
    styles,
    css`
    #welcomeBar {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    #welcomeCard,
    #infoCard {
      padding: 18px;
      padding-top: 0px;
    }

    sl-card::part(footer) {
      display: flex;
      justify-content: flex-end;
    }

    @media(min-width: 750px) {
      sl-card {
        width: 70vw;
      }
    }


    @media (horizontal-viewport-segments: 2) {
      #welcomeBar {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }

      #welcomeCard {
        margin-right: 64px;
      }
    }
  `];

  async firstUpdated() {
    this.checking = true;
    this.serviceStatuses = await checkAllServices();
    this.allReady = this.serviceStatuses.every(s => s.ready);
    this.checking = false;
  }

  share() {
    if ((navigator as any).share) {
      (navigator as any).share({
        title: 'PWABuilder pwa-starter',
        text: 'Check out the PWABuilder pwa-starter!',
        url: 'https://github.com/pwa-builder/pwa-starter',
      });
    }
  }

  render() {
    return html`
      <app-header></app-header>
      <main>
        <div id="welcomeBar">
          <sl-card id="welcomeCard">
            <div slot="header">
              <h2>${this.message}</h2>
            </div>
            <div style="margin-bottom: 1.5rem;">
              <h3 style="margin:0 0 0.5rem 0;">System Readiness Check</h3>
              ${this.checking ? html`<sl-spinner style="--size: 24px;"></sl-spinner> Checking services...` : html``}
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                ${this.serviceStatuses.map(s => html`
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <sl-icon name="${s.ready ? 'check-circle' : 'exclamation-triangle'}" style="color: ${s.ready ? 'var(--sl-color-success-600)' : 'var(--sl-color-danger-600)'}"></sl-icon>
                    <span style="font-weight: 500;">${s.label}</span>
                    <span style="font-size: 0.9em; color: var(--sl-color-neutral-600);">${s.description}</span>
                    ${!s.ready && s.error ? html`<sl-badge variant="danger">${s.error}</sl-badge>` : ''}
                  </div>
                `)}
              </div>
              <div style="margin-top: 1rem;">
                ${this.allReady ? html`
                  <sl-alert variant="success" open>
                    <sl-icon slot="icon" name="check-circle"></sl-icon>
                    <b>All systems operational.</b> You are ready to go!
                  </sl-alert>
                ` : html`
                  <sl-alert variant="warning" open>
                    <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                    Some features are not ready. Please check above.
                  </sl-alert>
                `}
              </div>
            </div>
            <p>
              WazeechAI is a Progressive Web App that integrates with advanced AI models.
              Chat with Wazi, your AI assistant, test performance, and explore AI capabilities
              right from your browser. For more information on the PWABuilder pwa-starter that powers this app, check out the
              <a href="https://docs.pwabuilder.com/#/starter/quick-start">
                documentation</a>.
            </p>
            <p id="mainInfo">
              This app demonstrates how to integrate AI chat into a PWA using
              <a href="https://lit.dev">Lit</a> and
              <a href="https://shoelace.style/">Shoelace</a>.
              Start by configuring your API key in the Chat section to begin interacting with Wazi!
            </p>
            ${'share' in navigator
              ? html`<sl-button slot="footer" variant="default" @click="${this.share}">
                        <sl-icon slot="prefix" name="share"></sl-icon>
                        Share this Starter!
                      </sl-button>`
              : null}
          </sl-card>
          <sl-card id="infoCard">
            <h2>Technology Used</h2>
            <ul>
              <li>
                <a href="https://www.typescriptlang.org/">TypeScript</a>
              </li>
              <li>
                <a href="https://lit.dev">lit</a>
              </li>
              <li>
                <a href="https://shoelace.style/">Shoelace</a>
              </li>
              <li>
                <a href="https://github.com/thepassle/app-tools/blob/master/router/README.md"
                  >App Tools Router</a>
              </li>
              <li>
                <strong>WazeechAI Integration</strong> - AI Chat Interface
              </li>
            </ul>
          </sl-card>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <sl-button href="${resolveRouterPath('chat')}" variant="primary">
              <sl-icon slot="prefix" name="chat"></sl-icon>
              Try Wazi Chat
            </sl-button>
            <sl-button href="${resolveRouterPath('about')}" variant="default">
              Navigate to About
            </sl-button>
          </div>
        </div>
      </main>
    `;
  }
}
