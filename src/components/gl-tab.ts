import { BaseElement } from '../core/base-element';

export class GlTab extends BaseElement {
  private _title = '';
  private _isActive = false;
  private _isClosable = true;

  static get observedAttributes(): string[] {
    return ['title', 'active', 'closable'];
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
    this.setAttribute('title', value);
  }

  get active(): boolean {
    return this._isActive;
  }

  set active(value: boolean) {
    this._isActive = value;
    this.toggleAttribute('active', value);
    if (this._isConnected) {
      this.render();
    }
  }

  get closable(): boolean {
    return this._isClosable;
  }

  set closable(value: boolean) {
    this._isClosable = value;
    this.toggleAttribute('closable', value);
    if (this._isConnected) {
      this.render();
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'title':
        this._title = newValue || '';
        break;
      case 'active':
        this._isActive = newValue !== null;
        break;
      case 'closable':
        this._isClosable = newValue !== 'false';
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
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          background: var(--gl-tab-bg, #f0f0f0);
          border: 1px solid var(--gl-tab-border, #ddd);
          border-bottom: none;
          user-select: none;
          position: relative;
          margin-right: -1px;
          transition: background-color 0.2s;
        }
        
        :host([active]) {
          background: var(--gl-tab-active-bg, #fff);
          z-index: 1;
        }
        
        :host(:hover:not([active])) {
          background: var(--gl-tab-hover-bg, #e0e0e0);
        }
        
        .title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }
        
        .close {
          margin-left: 8px;
          width: 16px;
          height: 16px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transition: background-color 0.2s;
        }
        
        .close:hover {
          background: var(--gl-tab-close-hover-bg, rgba(0, 0, 0, 0.1));
        }
        
        .close:active {
          background: var(--gl-tab-close-active-bg, rgba(0, 0, 0, 0.2));
        }
      </style>
      <span class="title">${this._title}</span>
      ${this._isClosable ? '<button class="close" aria-label="Close tab">✕</button>' : ''}
    `;

    this.setAttribute('draggable', 'true');

    const closeBtn = this.shadowRoot.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.handleClose);
    }

    this.addEventListener('click', this.handleClick);
  }

  private handleClick = (e: Event): void => {
    const mouseEvent = e as MouseEvent;
    if (!(mouseEvent.target as HTMLElement).closest('.close')) {
      this.emit('tab-clicked');
    }
  };

  private handleClose = (e: Event): void => {
    e.stopPropagation();
    this.emit('tab-close-requested');
  };
}

customElements.define('gl-tab', GlTab);
