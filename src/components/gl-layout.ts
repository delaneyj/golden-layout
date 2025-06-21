import { BaseElement } from '../core/base-element';
import type { LayoutConfig } from '../types/config';
import type { GlDropIndicator } from './gl-drop-indicator';

export class GlLayout extends BaseElement {
  private _config: LayoutConfig | null = null;
  private _draggedElement: HTMLElement | null = null;
  private _dropIndicator: GlDropIndicator | null = null;
  private _panelTypes: string[] = ['default'];

  static get observedAttributes(): string[] {
    return ['config', 'panel-types'];
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

  get panelTypes(): string[] {
    return this._panelTypes;
  }

  set panelTypes(value: string[]) {
    this._panelTypes = value;
    this.setAttribute('panel-types', JSON.stringify(value));
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
    
    // Parse panel-types attribute if present
    const panelTypesAttr = this.getAttribute('panel-types');
    if (panelTypesAttr) {
      try {
        this._panelTypes = JSON.parse(panelTypesAttr);
      } catch {
        console.warn('Invalid panel-types attribute, using defaults');
      }
    }
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

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'panel-types' && newValue) {
      try {
        this._panelTypes = JSON.parse(newValue);
      } catch {
        console.warn('Invalid panel-types attribute, using defaults');
      }
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        /* Gruvbox Dark Medium defaults */
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          /* Define default theme colors as CSS variables for child components */
          --gl-layout-bg: #282828;
          
          /* Use the CSS variable for background */
          background: var(--gl-layout-bg);
          --gl-layout-border: #504945;
          --gl-pane-bg: #282828;
          --gl-pane-border: #504945;
          --gl-header-bg: #3c3836;
          --gl-header-border: #504945;
          --gl-header-color: #ebdbb2;
          --gl-control-hover-bg: #504945;
          --gl-control-active-bg: #665c54;
          --gl-control-color: #bdae93;
          --gl-splitter-bg: #3c3836;
          --gl-splitter-hover-bg: #665c54;
          --gl-splitter-active-bg: #fe8019;
          --gl-component-padding: 16px;
          --gl-drop-indicator-bg: rgba(131, 165, 152, 0.15);
          --gl-drop-indicator-border: #83a598;
          --gl-drop-indicator-radius: 4px;
          --gl-drop-indicator-label-bg: #83a598;
          --gl-drop-indicator-label-color: #282828;
          --gl-pane-drag-over-border: #83a598;
          --gl-pane-drag-over-shadow: rgba(131, 165, 152, 0.25);
          --gl-pane-drag-over-bg: rgba(131, 165, 152, 0.05);
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
