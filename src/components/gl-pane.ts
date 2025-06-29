import type { GlLayout } from '@/components/gl-layout';
import { BaseElement } from '@/core/base-element';

export class GlPane extends BaseElement {
  private _isMaximized = false;
  private _documentClickHandler: (() => void) | null = null;
  private _panelType = 'default';
  private _id = '';
  private _componentState: Record<string, unknown> = {};
  private _title = '';
  private _originalParent: Element | null = null;
  private _originalNextSibling: Element | null = null;

  static get observedAttributes(): string[] {
    return ['panel-type', 'id', 'title'];
  }

  get isMaximized(): boolean {
    return this._isMaximized;
  }

  set isMaximized(value: boolean) {
    this._isMaximized = value;
    this.toggleAttribute('maximized', value);
    this.emit('maximize-changed', { isMaximized: value });
    this.updateMaximizeUI();
  }

  get panelType(): string {
    return this._panelType;
  }

  set panelType(value: string) {
    this._panelType = value;
    this.setAttribute('panel-type', value);
    this.emit('panel-type-changed', { panelType: value });
    this.notifyLayoutChange();
  }

  get paneId(): string {
    return this._id;
  }

  set paneId(value: string) {
    this._id = value;
    this.setAttribute('id', value);
  }

  get componentState(): Record<string, unknown> {
    return this._componentState;
  }

  set componentState(value: Record<string, unknown>) {
    this._componentState = value;
    this.emit('state-changed', { state: value });
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
    this.setAttribute('title', value);
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'panel-type') {
      this._panelType = newValue || 'default';
      this.validatePanelType();
    } else if (name === 'id') {
      this._id = newValue || '';
      this.validateId();
    } else if (name === 'title') {
      this._title = newValue || '';
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragleave', this.handleDragLeave);

    // Emit component lifecycle event
    this.emit('component-created', {
      title: this._title,
      state: this._componentState,
      panelType: this._panelType,
    });

    // Set default panel type if not set
    setTimeout(() => {
      if (!this.hasAttribute('panel-type')) {
        const layout = this.closest('gl-layout') as HTMLElement & { panelTypes?: string[] };
        const panelTypes = layout?.panelTypes || ['default'];
        this._panelType = panelTypes[0];
      }

      // Validate panel type
      this.validatePanelType();

      // Validate id
      this.validateId();
    }, 0);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up document event listener
    if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
      this._documentClickHandler = null;
    }
    // Emit component lifecycle event
    this.emit('component-destroyed');
  }

  protected render(): void {
    if (!this.shadowRoot) {
      console.error('GlPane: No shadow root!');
      return;
    }

    // Get panel types from parent layout
    const layout = this.closest('gl-layout') as HTMLElement & { panelTypes?: string[] };
    const panelTypes = layout?.panelTypes || ['default'];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          background: var(--gl-pane-bg, #282828); /* gruvbox bg0 */
          border: 1px solid var(--gl-pane-border, #504945); /* gruvbox bg2 */
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          
        }
        
        :host([maximized]) {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1000;
          max-width: none !important;
          max-height: none !important;
        }
        
        :host([invalid-panel-type]),
        :host([invalid-id]) {
          border-color: #fb4934 !important; /* gruvbox red */
          box-shadow: 0 0 0 2px rgba(251, 73, 52, 0.25);
        }
        
        :host(.drag-over) {
          border-color: var(--gl-pane-drag-over-border, #83a598); /* gruvbox blue */
          box-shadow: 0 0 0 2px var(--gl-pane-drag-over-shadow, rgba(131, 165, 152, 0.25));
        }
        
        :host(.drag-over)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gl-pane-drag-over-bg, rgba(131, 165, 152, 0.05));
          pointer-events: none;
          z-index: 10;
          border-radius: inherit;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          min-height: var(--gl-header-height, 30px);
          padding: 4px 8px;
          background: var(--gl-header-bg, #3c3836); /* gruvbox bg1 */
          border-bottom: 1px solid var(--gl-header-border, #504945); /* gruvbox bg2 */
          cursor: move;
          user-select: none;
          gap: 2px;
          
          &:active {
            cursor: grabbing;
          }
        }
        
        .panel-type-dropdown {
          background: var(--gl-control-hover-bg, #504945);
          border: 1px solid var(--gl-header-border, #504945);
          border-radius: 4px;
          color: var(--gl-header-color, #ebdbb2);
          font-size: 12px;
          padding: 2px 6px;
          cursor: pointer;
          outline: none;
          min-width: 80px;
          
          &:hover {
            background: var(--gl-control-active-bg, #665c54);
          }
          
          &:focus {
            border-color: var(--gl-splitter-active-bg, #fe8019);
          }
        }
        
        slot[name="header-center"] {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: var(--gl-header-color, #ebdbb2);
          min-width: 0;
          text-align: center;
        }
        
        .controls {
          position: relative;
          display: flex;
          gap: 2px;
        }
        
        .menu-button,
        .restore-button {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          color: var(--gl-control-color, #bdae93); /* gruvbox fg3 */
          opacity: 0.7;
          transition: all 0.2s;
          
          &:hover {
            background: var(--gl-control-hover-bg, #504945); /* gruvbox bg2 */
            opacity: 1;
          }
          
          &:active,
          &.active {
            background: var(--gl-control-active-bg, #665c54); /* gruvbox bg3 */
          }
        }
        
        .restore-button {
          &:hover {
            color: var(--gl-splitter-active-bg, #fe8019); /* gruvbox orange */
          }
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: var(--gl-header-bg, #3c3836);
          border: 1px solid var(--gl-header-border, #504945);
          border-radius: 4px;
          padding: 4px 0;
          min-width: 160px;
          display: none;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          
          &.show {
            display: block;
          }
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: none;
          background: none;
          color: var(--gl-header-color, #ebdbb2);
          cursor: pointer;
          width: 100%;
          text-align: left;
          font-size: 13px;
          transition: background-color 0.2s;
          
          &:hover {
            background: var(--gl-control-hover-bg, #504945);
          }
          
          & svg {
            flex-shrink: 0;
          }
        }
        
        .menu-divider {
          height: 1px;
          background: var(--gl-header-border, #504945);
          margin: 4px 0;
        }
        
        .pane-content {
          flex: 1;
          min-height: 0;
          overflow: auto;
          position: relative;
          background: var(--gl-pane-bg, #282828); /* gruvbox bg0 */
          padding: var(--gl-component-padding, 20px);
          box-sizing: border-box;
        }
        
        .pane-footer {
          background: var(--gl-footer-bg, var(--gl-pane-bg, #282828)); /* matches content background */
          border-top: 1px solid var(--gl-footer-border, var(--gl-header-border, #504945));
          color: var(--gl-footer-color, var(--gl-pane-color, #ebdbb2)); /* matches content color */
          font-size: 12px;
          padding: 8px;
          display: none; /* Hidden by default, JS will show if content exists */
          
          ::slotted(*) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
        }
      </style>
      <div class="header" draggable="true">
        <select class="panel-type-dropdown">
          ${panelTypes
            .map(
              (type: string) => `
            <option value="${type}" ${this._panelType === type ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>
          `,
            )
            .join('')}
        </select>
        <slot name="header-center"></slot>
        <div class="controls">
          <button class="restore-button" title="Restore" style="display: ${this._isMaximized ? 'flex' : 'none'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
              <path fill="currentColor" d="M7 13q-.425 0-.712-.288T6 12t.288-.712T7 11h10q.425 0 .713.288T18 12t-.288.713T17 13z"/>
            </svg>
          </button>
          <button class="menu-button" title="Pane Options">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="2" r="1" fill="currentColor"/>
              <circle cx="6" cy="6" r="1" fill="currentColor"/>
              <circle cx="6" cy="10" r="1" fill="currentColor"/>
            </svg>
          </button>
          <div class="dropdown-menu">
            <button class="menu-item split-horizontal">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="1" y="1" width="4" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
                <rect x="7" y="1" width="4" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
              </svg>
              Split Horizontal
            </button>
            <button class="menu-item split-vertical">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="1" y="1" width="10" height="4" fill="none" stroke="currentColor" stroke-width="1"/>
                <rect x="1" y="7" width="10" height="4" fill="none" stroke="currentColor" stroke-width="1"/>
              </svg>
              Split Vertical
            </button>
            <div class="menu-divider"></div>
            <button class="menu-item maximize">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              ${this._isMaximized ? 'Restore' : 'Maximize'}
            </button>
            <div class="menu-divider"></div>
            <button class="menu-item close">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Close Pane
            </button>
          </div>
        </div>
      </div>
      <div class="pane-content">
        <slot></slot>
      </div>
      <div class="pane-footer">
        <slot name="footer"></slot>
      </div>
    `;

    // Add event listeners after a microtask to ensure DOM is ready
    setTimeout(() => {
      const header = this.shadowRoot?.querySelector('.header') as HTMLElement;
      const menuButton = this.shadowRoot?.querySelector('.menu-button') as HTMLElement;
      const dropdownMenu = this.shadowRoot?.querySelector('.dropdown-menu') as HTMLElement;
      const splitHorizontalBtn = this.shadowRoot?.querySelector('.split-horizontal') as HTMLElement;
      const splitVerticalBtn = this.shadowRoot?.querySelector('.split-vertical') as HTMLElement;
      const maximizeBtn = this.shadowRoot?.querySelector('.maximize') as HTMLElement;
      const closeBtn = this.shadowRoot?.querySelector('.close') as HTMLElement;
      const restoreBtn = this.shadowRoot?.querySelector('.restore-button') as HTMLElement;
      const panelTypeDropdown = this.shadowRoot?.querySelector(
        '.panel-type-dropdown',
      ) as HTMLSelectElement;

      if (header) {
        header.addEventListener('dragstart', this.handleDragStart);
        header.addEventListener('dragend', this.handleDragEnd);
      }

      if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('show');
          menuButton.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        this._documentClickHandler = () => {
          dropdownMenu.classList.remove('show');
          menuButton.classList.remove('active');
        };
        document.addEventListener('click', this._documentClickHandler);

        // Prevent dropdown from closing when clicking inside
        dropdownMenu.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      if (splitHorizontalBtn) {
        splitHorizontalBtn.addEventListener('click', () => {
          this.handleSplit('horizontal');
          dropdownMenu?.classList.remove('show');
          menuButton?.classList.remove('active');
        });
      }
      if (splitVerticalBtn) {
        splitVerticalBtn.addEventListener('click', () => {
          this.handleSplit('vertical');
          dropdownMenu?.classList.remove('show');
          menuButton?.classList.remove('active');
        });
      }
      if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
          this.handleMaximize();
          dropdownMenu?.classList.remove('show');
          menuButton?.classList.remove('active');
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.handleClose();
          dropdownMenu?.classList.remove('show');
          menuButton?.classList.remove('active');
        });
      }

      if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
          this.handleMaximize();
        });
      }

      if (panelTypeDropdown) {
        panelTypeDropdown.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;
          this.panelType = target.value;
        });

        // Prevent drag when interacting with dropdown
        panelTypeDropdown.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
      }

      // Handle footer visibility
      const footer = this.shadowRoot?.querySelector('.pane-footer') as HTMLElement;
      const footerSlot = this.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;

      if (footer && footerSlot) {
        const updateFooterVisibility = () => {
          const hasContent = footerSlot.assignedNodes().length > 0;
          footer.style.display = hasContent ? 'block' : 'none';
        };

        // Check initial content
        updateFooterVisibility();

        // Listen for slot changes
        footerSlot.addEventListener('slotchange', updateFooterVisibility);
      }
    }, 0);
  }

  private handleDragStart = (e: DragEvent): void => {
    // Don't start drag if clicking on dropdown
    const target = e.target as HTMLElement;
    if (target.classList.contains('panel-type-dropdown')) {
      e.preventDefault();
      return;
    }

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';

      // Store reference to this pane in the layout
      const layout = this.closest('gl-layout') as HTMLElement & {
        draggedElement?: HTMLElement;
      };
      if (layout) {
        layout.draggedElement = this;
      }

      this.emit('pane-drag-start', { pane: this });
    }
  };

  private handleDragEnd = (): void => {
    this.emit('pane-drag-end', { pane: this });
  };

  private handleMaximize = (): void => {
    const layout = this.closest('gl-layout');
    if (!layout) return;

    if (!this.isMaximized) {
      // Store original parent and next sibling for restoration
      this._originalParent = this.parentElement;
      this._originalNextSibling = this.nextElementSibling;

      // Move to be a direct child of the layout's slot content
      const layoutRoot = layout.shadowRoot?.querySelector('slot');
      if (layoutRoot) {
        // Move the pane to be a direct child of gl-layout (light DOM)
        layout.appendChild(this);
      }
      this.isMaximized = true;
    } else {
      // Restore to original position
      if (this._originalParent?.isConnected) {
        if (this._originalNextSibling?.isConnected) {
          this._originalParent.insertBefore(this, this._originalNextSibling);
        } else {
          this._originalParent.appendChild(this);
        }
        this.isMaximized = false;
      } else {
        // If original parent is gone, try to find a suitable container
        const firstContainer = layout.querySelector('gl-row, gl-column');
        if (firstContainer) {
          // Find the last pane in the container
          const lastPane = Array.from(firstContainer.children)
            .filter((child) => child.tagName === 'GL-PANE')
            .pop();

          if (lastPane) {
            // Insert after the last pane with a splitter
            const splitter = document.createElement('gl-splitter');
            const isRow = firstContainer.tagName === 'GL-ROW';
            splitter.setAttribute('orientation', isRow ? 'horizontal' : 'vertical');

            lastPane.insertAdjacentElement('afterend', splitter);
            splitter.insertAdjacentElement('afterend', this);
          } else {
            // No panes, just append
            firstContainer.appendChild(this);
          }
          this.isMaximized = false;
        } else {
          // No container found, can't restore - stay maximized
          console.warn('Unable to restore pane: no suitable container found');
          return;
        }
      }

      // Clear the original parent references after restore
      this._originalParent = null;
      this._originalNextSibling = null;
    }

    // Notify layout of change
    this.notifyLayoutChange();
  };

  private handleSplit = (orientation: 'horizontal' | 'vertical'): void => {
    const parent = this.parentElement;
    if (!parent) return;

    // Create a new pane with a copy of this pane's content
    const newPane = document.createElement('gl-pane');
    newPane.setAttribute('panel-type', this._panelType);

    // Get layout to generate ID
    const layout = this.closest('gl-layout') as HTMLElement & { generatePaneId?: () => string };
    if (layout?.generatePaneId) {
      newPane.setAttribute('id', layout.generatePaneId());
    }

    // Create a container for the new pane
    const newContainer = document.createElement('gl-component-container');
    const newContent = document.createElement('div');
    newContent.className = 'demo-content';
    newContent.innerHTML = `<h2>New Pane</h2><p>Panel type: ${this._panelType}</p>`;
    newContainer.appendChild(newContent);
    newPane.appendChild(newContainer);

    // Create the appropriate container (row or column)
    const containerType = orientation === 'horizontal' ? 'gl-row' : 'gl-column';
    const container = document.createElement(containerType);

    // Create a splitter
    const splitter = document.createElement('gl-splitter');
    splitter.setAttribute('orientation', orientation);

    // Replace this pane with the new container
    parent.replaceChild(container, this);

    // Add elements in order
    container.appendChild(this);
    container.appendChild(splitter);
    container.appendChild(newPane);

    // Emit event
    this.emit('pane-split', {
      pane: this,
      orientation,
      newPane,
    });

    // Notify layout of change
    this.notifyLayoutChange();
  };

  private handleClose = (): void => {
    this.emit('pane-close', { pane: this });

    // Get layout reference before removing from DOM
    const layout = this.closest('gl-layout') as HTMLElement & { emitLayoutChange?: () => void };

    // Check if parent needs cleanup
    const parent = this.parentElement;
    this.remove();

    if (parent) {
      this.checkAndCleanupParent(parent);
      // Also clean up splitters next to where this pane was
      this.cleanupSplitters(parent);
      // Trigger resize to redistribute space
      this.triggerParentResize(parent);
    }

    // Notify layout of change
    const emitLayoutChange = layout?.emitLayoutChange;
    if (emitLayoutChange) {
      setTimeout(() => emitLayoutChange.call(layout), 0);
    }
  };

  private handleDragOver = (e: DragEvent): void => {
    const layout = this.closest('gl-layout') as GlLayout;

    if (layout?.draggedElement?.tagName === 'GL-PANE') {
      const draggedPane = layout.draggedElement;

      // Don't allow dropping on itself
      if (draggedPane === this) {
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'none';
        }
        this.classList.remove('drag-over');
        if (layout.dropIndicator) {
          layout.dropIndicator.hide();
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Add visual feedback
      this.classList.add('drag-over');

      // Determine drop position based on cursor location
      const rect = this.getBoundingClientRect();
      const clientX = e.clientX || 0;
      const clientY = e.clientY || 0;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const xRatio = rect.width > 0 ? x / rect.width : 0.5;
      const yRatio = rect.height > 0 ? y / rect.height : 0.5;

      // Determine which edge is closest to the cursor
      const edgeThreshold = 0.3; // 30% from edge
      let position: 'top' | 'right' | 'bottom' | 'left';

      // Calculate distances to each edge
      const distances = {
        top: yRatio,
        bottom: 1 - yRatio,
        left: xRatio,
        right: 1 - xRatio,
      };

      // Find the closest edge
      if (distances.top <= edgeThreshold && distances.top <= distances.bottom) {
        position = 'top';
      } else if (distances.bottom <= edgeThreshold && distances.bottom < distances.top) {
        position = 'bottom';
      } else if (distances.left <= edgeThreshold && distances.left <= distances.right) {
        position = 'left';
      } else if (distances.right <= edgeThreshold && distances.right < distances.left) {
        position = 'right';
      } else {
        // If cursor is not near any edge, find the closest one
        const minDistance = Math.min(
          distances.top,
          distances.bottom,
          distances.left,
          distances.right,
        );
        if (minDistance === distances.top) {
          position = 'top';
        } else if (minDistance === distances.bottom) {
          position = 'bottom';
        } else if (minDistance === distances.left) {
          position = 'left';
        } else {
          position = 'right';
        }
      }

      // Check if this drop would result in no layout change
      if (this.isNoOpDrop(draggedPane as GlPane, position)) {
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'none';
        }
        this.classList.remove('drag-over');
        if (layout.dropIndicator) {
          layout.dropIndicator.hide();
        }
        return;
      }

      // Show drop indicator with position
      if (layout.dropIndicator) {
        layout.dropIndicator.show(this, position);
      }
    }
  };

  private handleDragLeave = (e: DragEvent): void => {
    if (e.target === this) {
      this.classList.remove('drag-over');

      const layout = this.closest('gl-layout') as GlLayout;
      if (layout?.dropIndicator) {
        layout.dropIndicator.hide();
      }
    }
  };

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    const layout = this.closest('gl-layout') as GlLayout;

    const position = layout?.dropIndicator?.position || 'left';

    // Hide drop indicator
    if (layout?.dropIndicator) {
      layout.dropIndicator.hide();
    }

    const draggedPane = layout?.draggedElement;

    if (draggedPane?.tagName === 'GL-PANE' && draggedPane !== this) {
      this.createSplitLayout(
        draggedPane as GlPane,
        position as 'top' | 'right' | 'bottom' | 'left',
      );

      // Emit event
      this.emit('pane-moved', {
        pane: draggedPane,
        target: this,
        position,
      });
    }
  };

  private createSplitLayout(
    draggedPane: GlPane,
    position: 'top' | 'right' | 'bottom' | 'left',
  ): void {
    const parent = this.parentElement;
    if (!parent) return;

    // Determine if we need a row or column
    const isHorizontalSplit = position === 'left' || position === 'right';
    const containerType = isHorizontalSplit ? 'gl-row' : 'gl-column';

    // Create new container
    const newContainer = document.createElement(containerType);

    // Create splitter
    const splitter = document.createElement('gl-splitter');
    splitter.setAttribute('orientation', isHorizontalSplit ? 'horizontal' : 'vertical');

    // Remove dragged pane from its current location
    const draggedParent = draggedPane.parentElement;
    draggedPane.remove();

    // Replace current pane with new container
    parent.replaceChild(newContainer, this);

    // Add elements in correct order
    if (position === 'left' || position === 'top') {
      newContainer.appendChild(draggedPane);
      newContainer.appendChild(splitter);
      newContainer.appendChild(this);
    } else {
      newContainer.appendChild(this);
      newContainer.appendChild(splitter);
      newContainer.appendChild(draggedPane);
    }

    // Check if dragged pane's parent needs cleanup
    if (draggedParent) {
      this.checkAndCleanupParent(draggedParent);
      // Trigger resize on the old parent to redistribute space
      this.triggerParentResize(draggedParent);
    }

    // Trigger resize on the new container
    this.triggerParentResize(newContainer);
  }

  private checkAndCleanupParent(parent: Element): void {
    const children = Array.from(parent.children).filter((child) => child.tagName !== 'GL-SPLITTER');

    if (children.length === 0 && parent.parentElement) {
      // Parent is empty, remove it
      const grandParent = parent.parentElement;
      parent.remove();
      this.cleanupSplitters(grandParent);
      this.triggerParentResize(grandParent);
    } else if (
      children.length === 1 &&
      parent.parentElement &&
      (parent.tagName === 'GL-ROW' || parent.tagName === 'GL-COLUMN')
    ) {
      // Parent has only one child, replace parent with that child
      const onlyChild = children[0];
      const grandParent = parent.parentElement;
      grandParent.replaceChild(onlyChild, parent);
      this.cleanupSplitters(grandParent);
      this.triggerParentResize(grandParent);
    } else {
      // Just clean up splitters and trigger resize
      this.cleanupSplitters(parent);
      this.triggerParentResize(parent);
    }
  }

  private cleanupSplitters(container: Element): void {
    const children = Array.from(container.children);
    let i = 0;

    while (i < children.length) {
      const child = children[i];

      // Remove splitter if it's at the start
      if (i === 0 && child.tagName === 'GL-SPLITTER') {
        child.remove();
        children.splice(i, 1);
        continue;
      }

      // Remove splitter if it's at the end
      if (i === children.length - 1 && child.tagName === 'GL-SPLITTER') {
        child.remove();
        children.splice(i, 1);
        continue;
      }

      // Remove splitter if it's adjacent to another splitter
      if (i > 0 && child.tagName === 'GL-SPLITTER' && children[i - 1].tagName === 'GL-SPLITTER') {
        child.remove();
        children.splice(i, 1);
        continue;
      }

      i++;
    }
  }

  private isNoOpDrop(sourcePane: GlPane, dropPosition: string): boolean {
    const sourceParent = sourcePane.parentElement;
    const targetParent = this.parentElement;

    if (sourceParent !== targetParent) {
      return false;
    }

    const siblings = Array.from(sourceParent?.children || []);
    const sourcePos = this.getPanePosition(sourcePane, siblings);
    const targetPos = this.getPanePosition(this, siblings);

    const isRow = sourceParent?.tagName === 'GL-ROW';
    const isColumn = sourceParent?.tagName === 'GL-COLUMN';

    if (isRow) {
      if (dropPosition === 'left' && targetPos === sourcePos + 1) {
        return true;
      }
      if (dropPosition === 'right' && targetPos === sourcePos - 1) {
        return true;
      }
    } else if (isColumn) {
      if (dropPosition === 'top' && targetPos === sourcePos + 1) {
        return true;
      }
      if (dropPosition === 'bottom' && targetPos === sourcePos - 1) {
        return true;
      }
    }

    return false;
  }

  private getPanePosition(pane: Element, siblings: Element[]): number {
    let position = 0;
    for (const sibling of siblings) {
      if (sibling === pane) {
        return position;
      }
      if (sibling.tagName === 'GL-PANE') {
        position++;
      }
    }
    return -1;
  }

  private triggerParentResize(parent: Element): void {
    // Dispatch a resize event to trigger the parent's resize observer
    if (parent && (parent.tagName === 'GL-ROW' || parent.tagName === 'GL-COLUMN')) {
      // Call the public updateLayout method
      const updateMethod = (parent as HTMLElement & { updateLayout?: () => void }).updateLayout;
      if (typeof updateMethod === 'function') {
        updateMethod.call(parent);
      }
    }
  }

  private validatePanelType(): void {
    const layout = this.closest('gl-layout') as HTMLElement & { panelTypes?: string[] };
    const panelTypes = layout?.panelTypes || ['default'];

    if (!panelTypes.includes(this._panelType)) {
      console.error(
        `Invalid panel type "${this._panelType}" for gl-pane. Valid options are: ${panelTypes.join(', ')}`,
      );
      // Add visual indicator
      this.setAttribute('invalid-panel-type', '');
      // Set to first valid option
      this._panelType = panelTypes[0];
      this.setAttribute('panel-type', this._panelType);
    } else {
      // Remove visual indicator if valid
      this.removeAttribute('invalid-panel-type');
    }
  }

  private validateId(): void {
    if (!this._id) {
      // ID will be auto-generated by layout, so just remove invalid indicator
      this.removeAttribute('invalid-id');
      return;
    }

    // Check for duplicate ids within the layout
    const layout = this.closest('gl-layout');
    if (layout) {
      const allPanes = layout.querySelectorAll('gl-pane');
      const duplicates = Array.from(allPanes).filter(
        (pane) => pane !== this && pane.getAttribute('id') === this._id,
      );

      if (duplicates.length > 0) {
        console.error(`Duplicate pane id "${this._id}" found. Each pane must have a unique id.`);
        this.setAttribute('invalid-id', '');
      } else {
        this.removeAttribute('invalid-id');
      }
    }
  }

  private notifyLayoutChange(): void {
    const layout = this.closest('gl-layout') as HTMLElement & { emitLayoutChange?: () => void };
    const emitLayoutChange = layout?.emitLayoutChange;
    if (emitLayoutChange) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => emitLayoutChange.call(layout), 0);
    }
  }

  // Component state management methods (from gl-component-container)
  updateState(state: Record<string, unknown>): void {
    this.componentState = { ...this._componentState, ...state };
  }

  getState(): Record<string, unknown> {
    return { ...this._componentState };
  }

  private updateMaximizeUI(): void {
    if (!this.shadowRoot) return;

    const restoreBtn = this.shadowRoot.querySelector('.restore-button') as HTMLElement;
    const maximizeMenuItem = this.shadowRoot.querySelector('.menu-item.maximize') as HTMLElement;

    if (restoreBtn) {
      restoreBtn.style.display = this._isMaximized ? 'flex' : 'none';
    }

    if (maximizeMenuItem) {
      maximizeMenuItem.textContent = this._isMaximized ? 'Restore' : 'Maximize';
      // Re-add the icon
      const icon = document.createElement('svg');
      icon.setAttribute('width', '12');
      icon.setAttribute('height', '12');
      icon.setAttribute('viewBox', '0 0 12 12');
      icon.innerHTML =
        '<rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/>';
      maximizeMenuItem.insertBefore(icon, maximizeMenuItem.firstChild);
    }
  }
}

customElements.define('gl-pane', GlPane);
