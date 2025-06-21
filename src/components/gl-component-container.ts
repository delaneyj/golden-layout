import { BaseElement } from '@/core/base-element';

export class GlComponentContainer extends BaseElement {
  private _title = '';
  private _componentState: Record<string, unknown> = {};

  static get observedAttributes(): string[] {
    return ['title'];
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
    this.setAttribute('title', value);
  }

  get componentState(): Record<string, unknown> {
    return this._componentState;
  }

  set componentState(value: Record<string, unknown>) {
    this._componentState = value;
    this.emit('state-changed', { state: value });
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'title') {
      this._title = newValue || '';
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.emit('component-created', {
      title: this._title,
      state: this._componentState,
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.emit('component-destroyed');
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        
        .container {
          padding: var(--gl-component-padding, 10px);
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        
        ::slotted(*) {
          display: block;
        }
      </style>
      <div class="container">
        <slot></slot>
      </div>
    `;
  }

  updateState(state: Record<string, unknown>): void {
    this.componentState = { ...this._componentState, ...state };
  }

  getState(): Record<string, unknown> {
    return { ...this._componentState };
  }
}

customElements.define('gl-component-container', GlComponentContainer);
