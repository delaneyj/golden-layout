import { BaseElement } from '@/core/base-element';

export class GlRow extends BaseElement {
  private resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.setupResizeObserver();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
          gap: 0;
        }
        
        ::slotted(*) {
          flex: 1 1 auto;
          min-width: 0;
          position: relative;
        }
        
        ::slotted([data-width]) {
          flex: 0 0 auto;
        }
        
        ::slotted(gl-splitter) {
          flex: 0 0 var(--gl-splitter-size, 5px);
        }
      </style>
      <slot></slot>
    `;
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateChildSizes();
    });

    this.resizeObserver.observe(this);
  }

  public updateLayout(): void {
    this.updateChildSizes();
  }

  private updateChildSizes(): void {
    const children = Array.from(this.children).filter(
      (child) => child.tagName !== 'GL-SPLITTER',
    ) as HTMLElement[];

    // Reset all children to use flexbox
    children.forEach((child) => {
      child.style.flex = '1 1 auto';
      child.style.width = '';
      child.style.minWidth = '50px';
    });
  }
}

customElements.define('gl-row', GlRow);
