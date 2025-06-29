import type { TilexDropIndicator } from '@/components/tx-drop-indicator';
import { BaseElement } from '@/core/base-element';
import type { LayoutConfig } from '@/types/config';

interface LayoutNode {
  type: 'pane' | 'row' | 'column';
  id?: string;
  panelType?: string;
  children?: LayoutNode[];
}

export class TilexLayout extends BaseElement {
  #config: LayoutConfig | null = null;
  #draggedElement: HTMLElement | null = null;
  #dropIndicator: TilexDropIndicator | null = null;
  #panelTypes: string[] = ['default'];
  #panePrefix = 'pane';
  #paneCounter = 0;

  static get observedAttributes(): string[] {
    return ['config', 'panel-types', 'pane-prefix'];
  }

  get config(): LayoutConfig | null {
    return this.#config;
  }

  set config(value: LayoutConfig | null) {
    this.#config = value;
    if (this._isConnected) {
      this.render();
    }
  }

  get panelTypes(): string[] {
    return this.#panelTypes;
  }

  set panelTypes(value: string[]) {
    this.#panelTypes = value;
    this.setAttribute('panel-types', JSON.stringify(value));
  }

  get panePrefix(): string {
    return this.#panePrefix;
  }

  set panePrefix(value: string) {
    this.#panePrefix = value;
    this.setAttribute('pane-prefix', value);
  }

  generatePaneId(): string {
    this.#paneCounter++;
    return `${this.#panePrefix}-${this.#paneCounter}`;
  }

  get draggedElement(): HTMLElement | null {
    return this.#draggedElement;
  }

  set draggedElement(value: HTMLElement | null) {
    this.#draggedElement = value;
  }

  get dropIndicator(): TilexDropIndicator | null {
    return this.#dropIndicator;
  }

  set dropIndicator(value: TilexDropIndicator | null) {
    this.#dropIndicator = value;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragstart', this.handleDragStart);
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragend', this.handleDragEnd);

    // Create drop indicator
    this.#dropIndicator = document.createElement('tx-drop-indicator') as TilexDropIndicator;
    document.body.appendChild(this.#dropIndicator);

    // Parse panel-types attribute if present
    const panelTypesAttr = this.getAttribute('panel-types');
    if (panelTypesAttr) {
      try {
        this.#panelTypes = JSON.parse(panelTypesAttr);
      } catch {
        console.warn('Invalid panel-types attribute, using defaults');
      }
    }

    // Parse pane-prefix attribute if present
    const panePrefixAttr = this.getAttribute('pane-prefix');
    if (panePrefixAttr) {
      this.#panePrefix = panePrefixAttr;
    }

    // Auto-generate IDs for panes without IDs
    setTimeout(() => {
      this.assignPaneIds();
      this.emitLayoutChange();
    }, 0);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragstart', this.handleDragStart);
    this.removeEventListener('dragover', this.handleDragOver);
    this.removeEventListener('drop', this.handleDrop);
    this.removeEventListener('dragend', this.handleDragEnd);

    // Remove drop indicator
    if (this.#dropIndicator && typeof this.#dropIndicator.remove === 'function') {
      this.#dropIndicator.remove();
    }
    this.#dropIndicator = null;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'panel-types' && newValue) {
      try {
        this.#panelTypes = JSON.parse(newValue);
      } catch {
        console.warn('Invalid panel-types attribute, using defaults');
      }
    } else if (name === 'pane-prefix' && newValue) {
      this.#panePrefix = newValue;
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
          --tx-layout-bg: #282828;
          
          /* Use the CSS variable for background */
          background: var(--tx-layout-bg);
          --tx-layout-border: #504945;
          --tx-pane-bg: #282828;
          --tx-pane-border: #504945;
          --tx-header-bg: #3c3836;
          --tx-header-border: #504945;
          --tx-header-color: #ebdbb2;
          --tx-control-hover-bg: #504945;
          --tx-control-active-bg: #665c54;
          --tx-control-color: #bdae93;
          --tx-splitter-bg: #3c3836;
          --tx-splitter-hover-bg: #665c54;
          --tx-splitter-active-bg: #fe8019;
          --tx-component-padding: 20px;
          --tx-drop-indicator-bg: rgba(131, 165, 152, 0.15);
          --tx-drop-indicator-border: #83a598;
          --tx-drop-indicator-radius: 4px;
          --tx-drop-indicator-label-bg: #83a598;
          --tx-drop-indicator-label-color: #282828;
          --tx-pane-drag-over-border: #83a598;
          --tx-pane-drag-over-shadow: rgba(131, 165, 152, 0.25);
          --tx-pane-drag-over-bg: rgba(131, 165, 152, 0.05);
        }
        ::slotted(*) {
          width: 100%;
          height: 100%;
        }
        
        /* Ensure maximized panes fill the entire layout */
        ::slotted(tx-pane[maximized]) {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1000 !important;
        }
      </style>
      <slot></slot>
    `;
  }

  private handleDragStart = (e: DragEvent): void => {
    // Check if it's a pane header being dragged
    const target = e.target as HTMLElement;
    const pane = target.closest('tx-pane');

    if (pane && target.classList.contains('header')) {
      this.#draggedElement = pane as HTMLElement;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
      this.emit('item-drag-start', { element: pane });
    } else if (target.hasAttribute('draggable')) {
      // Legacy support for other draggable elements
      this.#draggedElement = target;
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
    if (this.#draggedElement && e.target instanceof HTMLElement) {
      this.emit('item-dropped', {
        draggedElement: this.#draggedElement,
        targetElement: e.target,
      });
    }
  };

  private handleDragEnd = (): void => {
    // Clean up any drag-over classes
    this.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });

    // Hide drop indicator
    this.#dropIndicator?.hide();

    this.#draggedElement = null;
    this.emit('item-drag-end');

    // Emit layout change event
    this.emitLayoutChange();
  };

  private getLayoutStructure(): LayoutNode | null {
    const serializeElement = (element: Element): LayoutNode | null => {
      if (element.tagName === 'TX-PANE') {
        return {
          type: 'pane',
          id: element.getAttribute('id') || undefined,
          panelType: element.getAttribute('panel-type') || 'default',
        };
      }
      if (element.tagName === 'TX-ROW') {
        return {
          type: 'row',
          children: Array.from(element.children)
            .filter((child) => child.tagName !== 'TX-SPLITTER')
            .map((child) => serializeElement(child))
            .filter((child): child is LayoutNode => child !== null),
        };
      }
      if (element.tagName === 'TX-COLUMN') {
        return {
          type: 'column',
          children: Array.from(element.children)
            .filter((child) => child.tagName !== 'TX-SPLITTER')
            .map((child) => serializeElement(child))
            .filter((child): child is LayoutNode => child !== null),
        };
      }
      return null;
    };

    // Find the root container (first child that's not a slot)
    const rootContainer = Array.from(this.children).find((child) =>
      ['TX-ROW', 'TX-COLUMN', 'TX-PANE'].includes(child.tagName),
    );

    return rootContainer ? serializeElement(rootContainer) : null;
  }

  public emitLayoutChange(): void {
    const layout = this.getLayoutStructure();
    const maximizedId = this.getMaximizedPaneId();
    this.emit('layout-change', { maximizedId, layout });
  }

  private getMaximizedPaneId(): string | null {
    const maximizedPane = this.querySelector('tx-pane[maximized]');
    return maximizedPane ? maximizedPane.getAttribute('id') : null;
  }

  private assignPaneIds(): void {
    const allPanes = this.querySelectorAll('tx-pane');
    allPanes.forEach((pane) => {
      if (!pane.hasAttribute('id') || pane.getAttribute('id') === '') {
        pane.setAttribute('id', this.generatePaneId());
      }
    });
  }
}

customElements.define('tx-layout', TilexLayout);
