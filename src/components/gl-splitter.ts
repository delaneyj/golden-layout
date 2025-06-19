import { BaseElement } from '../core/base-element';

export class GlSplitter extends BaseElement {
  private _orientation: 'horizontal' | 'vertical' = 'vertical';
  private _isDragging = false;
  private _startPos = 0;
  private _startSizeBefore = 0;
  private _startSizeAfter = 0;
  private _elementBefore: HTMLElement | null = null;
  private _elementAfter: HTMLElement | null = null;

  static get observedAttributes(): string[] {
    return ['orientation'];
  }

  get orientation(): 'horizontal' | 'vertical' {
    return this._orientation;
  }

  set orientation(value: 'horizontal' | 'vertical') {
    this._orientation = value;
    this.setAttribute('orientation', value);
    if (this._isConnected) {
      this.render();
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'orientation' && (newValue === 'horizontal' || newValue === 'vertical')) {
      this._orientation = newValue;
      if (this._isConnected) {
        this.render();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mousedown', this.handleMouseDown);
    this.addEventListener('touchstart', this.handleTouchStart, { passive: false });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mousedown', this.handleMouseDown);
    this.removeEventListener('touchstart', this.handleTouchStart);
    this.stopDragging();
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    const isHorizontal = this._orientation === 'horizontal';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--gl-splitter-bg, #e0e0e0);
          position: relative;
          user-select: none;
          touch-action: none;
          flex-shrink: 0;
          ${isHorizontal ? 'cursor: ew-resize;' : 'cursor: ns-resize;'}
          ${isHorizontal ? 
            `width: var(--gl-splitter-size, 5px);
             min-width: var(--gl-splitter-size, 5px);
             max-width: var(--gl-splitter-size, 5px);
             height: 100%;` : 
            `height: var(--gl-splitter-size, 5px);
             min-height: var(--gl-splitter-size, 5px);
             max-height: var(--gl-splitter-size, 5px);
             width: 100%;`
          }
        }
        
        :host(:hover) {
          background: var(--gl-splitter-hover-bg, #d0d0d0);
        }
        
        :host(.dragging) {
          background: var(--gl-splitter-active-bg, #bbb);
        }
        
        .handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          ${isHorizontal ? 'width: 2px; height: 30px;' : 'width: 30px; height: 2px;'}
          background: var(--gl-splitter-handle-color, rgba(0, 0, 0, 0.2));
          border-radius: 1px;
        }
      </style>
      <div class="handle"></div>
    `;
  }

  private handleMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
    this.startDragging(e.clientX, e.clientY);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDragging(touch.clientX, touch.clientY);
  };

  private startDragging(clientX: number, clientY: number): void {
    this._isDragging = true;
    this.classList.add('dragging');

    const isHorizontal = this._orientation === 'horizontal';
    this._startPos = isHorizontal ? clientX : clientY;

    // Find adjacent elements
    const parent = this.parentElement;
    if (!parent) return;

    const children = Array.from(parent.children);
    const index = children.indexOf(this);

    this._elementBefore = children[index - 1] as HTMLElement;
    this._elementAfter = children[index + 1] as HTMLElement;

    if (!this._elementBefore || !this._elementAfter) return;

    this._startSizeBefore = isHorizontal
      ? this._elementBefore.offsetWidth
      : this._elementBefore.offsetHeight;
    this._startSizeAfter = isHorizontal
      ? this._elementAfter.offsetWidth
      : this._elementAfter.offsetHeight;

    // Add global event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    this.emit('splitter-drag-start');
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this._isDragging) return;
    this.updateSizes(e.clientX, e.clientY);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this._isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.updateSizes(touch.clientX, touch.clientY);
  };

  private updateSizes(clientX: number, clientY: number): void {
    if (!this._elementBefore || !this._elementAfter) return;

    const isHorizontal = this._orientation === 'horizontal';
    const currentPos = isHorizontal ? clientX : clientY;
    const delta = currentPos - this._startPos;

    const newSizeBefore = Math.max(50, this._startSizeBefore + delta);
    const newSizeAfter = Math.max(50, this._startSizeAfter - delta);

    if (isHorizontal) {
      this._elementBefore.style.flex = `0 0 ${newSizeBefore}px`;
      this._elementAfter.style.flex = `0 0 ${newSizeAfter}px`;
    } else {
      this._elementBefore.style.flex = `0 0 ${newSizeBefore}px`;
      this._elementAfter.style.flex = `0 0 ${newSizeAfter}px`;
    }

    this.emit('splitter-dragging', {
      sizeBefore: newSizeBefore,
      sizeAfter: newSizeAfter,
    });
  }

  private handleMouseUp = (): void => {
    this.stopDragging();
  };

  private handleTouchEnd = (): void => {
    this.stopDragging();
  };

  private stopDragging(): void {
    if (!this._isDragging) return;

    this._isDragging = false;
    this.classList.remove('dragging');

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    this.emit('splitter-drag-end');
  }
}

customElements.define('gl-splitter', GlSplitter);
