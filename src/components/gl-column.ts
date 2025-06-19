import { BaseElement } from '../core/base-element';

export class GlColumn extends BaseElement {
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
          flex-direction: column;
          width: 100%;
          height: 100%;
          gap: var(--gl-splitter-size, 5px);
        }
        
        ::slotted(*) {
          flex: 1;
          min-height: 0;
          position: relative;
        }
        
        ::slotted([data-height]) {
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
    const totalHeight = this.offsetHeight;
    const splitterSize = Number.parseInt(
      getComputedStyle(this).getPropertyValue('--gl-splitter-size') || '5',
    );
    const splitterTotal = splitterSize * Math.max(0, children.length - 1);
    const availableHeight = totalHeight - splitterTotal;

    // Calculate flexible space
    let fixedHeight = 0;
    let flexCount = 0;

    children.forEach((child) => {
      const height = child.dataset.height;
      if (height) {
        const heightValue = height.endsWith('%')
          ? (Number.parseFloat(height) / 100) * availableHeight
          : Number.parseFloat(height);
        fixedHeight += heightValue;
        child.style.height = `${heightValue}px`;
      } else {
        flexCount++;
      }
    });

    // Distribute remaining space to flexible children
    if (flexCount > 0) {
      const flexHeight = Math.max(0, availableHeight - fixedHeight) / flexCount;
      children.forEach((child) => {
        if (!child.dataset.height) {
          child.style.flex = `0 0 ${flexHeight}px`;
        }
      });
    }
  }
}

customElements.define('gl-column', GlColumn);
