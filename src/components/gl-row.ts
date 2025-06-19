import { BaseElement } from '../core/base-element';

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
          gap: var(--gl-splitter-size, 5px);
        }
        
        ::slotted(*) {
          flex: 1;
          min-width: 0;
          position: relative;
        }
        
        ::slotted([data-width]) {
          flex: 0 0 auto;
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

  private updateChildSizes(): void {
    const children = Array.from(this.children) as HTMLElement[];
    const totalWidth = this.offsetWidth;
    const splitterSize = Number.parseInt(
      getComputedStyle(this).getPropertyValue('--gl-splitter-size') || '5',
    );
    const splitterTotal = splitterSize * Math.max(0, children.length - 1);
    const availableWidth = totalWidth - splitterTotal;

    // Calculate flexible space
    let fixedWidth = 0;
    let flexCount = 0;

    children.forEach((child) => {
      const width = child.dataset.width;
      if (width) {
        const widthValue = width.endsWith('%')
          ? (Number.parseFloat(width) / 100) * availableWidth
          : Number.parseFloat(width);
        fixedWidth += widthValue;
        child.style.width = `${widthValue}px`;
      } else {
        flexCount++;
      }
    });

    // Distribute remaining space to flexible children
    if (flexCount > 0) {
      const flexWidth = Math.max(0, availableWidth - fixedWidth) / flexCount;
      children.forEach((child) => {
        if (!child.dataset.width) {
          child.style.flex = `0 0 ${flexWidth}px`;
        }
      });
    }
  }
}

customElements.define('gl-row', GlRow);
