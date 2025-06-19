import { BaseElement } from '../core/base-element';
import type { LayoutConfig } from '../types/config';

export class GlLayout extends BaseElement {
  private _config: LayoutConfig | null = null;
  private _draggedElement: HTMLElement | null = null;

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
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragstart', this.handleDragStart);
    this.removeEventListener('dragover', this.handleDragOver);
    this.removeEventListener('drop', this.handleDrop);
    this.removeEventListener('dragend', this.handleDragEnd);
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
    if (e.target instanceof HTMLElement && e.target.hasAttribute('draggable')) {
      this._draggedElement = e.target;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
      this.emit('item-drag-start', { element: e.target });
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
    this._draggedElement = null;
    this.emit('item-drag-end');
  };
}

customElements.define('gl-layout', GlLayout);
