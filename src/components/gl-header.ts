import { BaseElement } from '../core/base-element';

export class GlHeader extends BaseElement {
  private _showMaximize = true;
  private _showClose = true;

  static get observedAttributes(): string[] {
    return ['show-maximize', 'show-close'];
  }

  get showMaximize(): boolean {
    return this._showMaximize;
  }

  set showMaximize(value: boolean) {
    this._showMaximize = value;
    this.toggleAttribute('show-maximize', value);
    if (this._isConnected) {
      this.render();
    }
  }

  get showClose(): boolean {
    return this._showClose;
  }

  set showClose(value: boolean) {
    this._showClose = value;
    this.toggleAttribute('show-close', value);
    if (this._isConnected) {
      this.render();
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'show-maximize':
        this._showMaximize = newValue !== 'false';
        break;
      case 'show-close':
        this._showClose = newValue !== 'false';
        break;
    }
    if (this._isConnected) {
      this.render();
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          background: var(--gl-header-bg, #e0e0e0);
          border-bottom: 1px solid var(--gl-header-border, #ccc);
          height: var(--gl-header-height, 30px);
          position: relative;
        }
        
        .tabs {
          flex: 1;
          display: flex;
          align-items: flex-end;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
        }
        
        .tabs::-webkit-scrollbar {
          height: 4px;
        }
        
        .tabs::-webkit-scrollbar-thumb {
          background: var(--gl-scrollbar-thumb, rgba(0, 0, 0, 0.2));
          border-radius: 2px;
        }
        
        .controls {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 8px;
        }
        
        .control-btn {
          width: 20px;
          height: 20px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transition: background-color 0.2s;
        }
        
        .control-btn:hover {
          background: var(--gl-control-hover-bg, rgba(0, 0, 0, 0.1));
        }
        
        .control-btn:active {
          background: var(--gl-control-active-bg, rgba(0, 0, 0, 0.2));
        }
      </style>
      <div class="tabs">
        <slot name="tabs"></slot>
      </div>
      <div class="controls">
        ${this._showMaximize ? '<button class="control-btn maximize" aria-label="Maximize">⬜</button>' : ''}
        ${this._showClose ? '<button class="control-btn close" aria-label="Close">✕</button>' : ''}
      </div>
    `;

    const maximizeBtn = this.shadowRoot.querySelector('.maximize');
    const closeBtn = this.shadowRoot.querySelector('.close');

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => this.emit('maximize-requested'));
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.emit('close-requested'));
    }
  }
}

customElements.define('gl-header', GlHeader);
