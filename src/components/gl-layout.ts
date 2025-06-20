import { BaseElement } from '../core/base-element';
import type { LayoutConfig } from '../types/config';
import type { GlDropIndicator } from './gl-drop-indicator';

export class GlLayout extends BaseElement {
  private _config: LayoutConfig | null = null;
  private _draggedElement: HTMLElement | null = null;
  private _dropIndicator: GlDropIndicator | null = null;

  static get observedAttributes(): string[] {
    return ['config'];
  }

  get config(): LayoutConfig | null {
    return this._config;
  }

  set config(value: LayoutConfig | null) {
    this._config = value;
    if (this._isConnected) {
      this.render();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragstart', this.handleDragStart);
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragend', this.handleDragEnd);
    
    // Create drop indicator
    this._dropIndicator = document.createElement('gl-drop-indicator') as GlDropIndicator;
    document.body.appendChild(this._dropIndicator);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragstart', this.handleDragStart);
    this.removeEventListener('dragover', this.handleDragOver);
    this.removeEventListener('drop', this.handleDrop);
    this.removeEventListener('dragend', this.handleDragEnd);
    
    // Remove drop indicator
    if (this._dropIndicator && typeof this._dropIndicator.remove === 'function') {
      this._dropIndicator.remove();
    }
    this._dropIndicator = null;
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        ::slotted(*) {
          width: 100%;
          height: 100%;
        }
      </style>
      <slot></slot>
    `;
  }

  private handleDragStart = (e: DragEvent): void => {
    // Check if it's a pane header being dragged
    const target = e.target as HTMLElement;
    const pane = target.closest('gl-pane');
    
    if (pane && target.classList.contains('header')) {
      this._draggedElement = pane as HTMLElement;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
      this.emit('item-drag-start', { element: pane });
    } else if (target.hasAttribute('draggable')) {
      // Legacy support for other draggable elements
      this._draggedElement = target;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
      this.emit('item-drag-start', { element: target });
    }
  };

  private handleDragOver = (e: DragEvent): void => {
    if (e.dataTransfer?.effectAllowed === 'move') {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    }
  };

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    if (this._draggedElement && e.target instanceof HTMLElement) {
      this.emit('item-dropped', {
        draggedElement: this._draggedElement,
        targetElement: e.target,
      });
    }
  };

  private handleDragEnd = (): void => {
    // Clean up any drag-over classes
    this.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // Hide drop indicator
    this._dropIndicator?.hide();
    
    this._draggedElement = null;
    this.emit('item-drag-end');
  };
}

customElements.define('gl-layout', GlLayout);
