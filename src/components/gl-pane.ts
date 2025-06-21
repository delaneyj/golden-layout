import { BaseElement } from '../core/base-element';

export class GlPane extends BaseElement {
  private _isMaximized = false;
  private _documentClickHandler: (() => void) | null = null;
  private _panelType = 'default';

  static get observedAttributes(): string[] {
    return ['panel-type'];
  }

  get isMaximized(): boolean {
    return this._isMaximized;
  }

  set isMaximized(value: boolean) {
    this._isMaximized = value;
    this.toggleAttribute('maximized', value);
    this.emit('maximize-changed', { isMaximized: value });
  }

  get panelType(): string {
    return this._panelType;
  }

  set panelType(value: string) {
    this._panelType = value;
    this.setAttribute('panel-type', value);
    this.emit('panel-type-changed', { panelType: value });
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'panel-type') {
      this._panelType = newValue || 'default';
      this.validatePanelType();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragleave', this.handleDragLeave);
    
    // Set default panel type if not set
    setTimeout(() => {
      if (!this.hasAttribute('panel-type')) {
        const layout = this.closest('gl-layout') as HTMLElement & { panelTypes?: string[] };
        const panelTypes = layout?.panelTypes || ['default'];
        this._panelType = panelTypes[0];
      }
      
      // Validate panel type
      this.validatePanelType();
    }, 0);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up document event listener
    if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
      this._documentClickHandler = null;
    }
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
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1000;
        }
        
        :host([invalid-panel-type]) {
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
          height: var(--gl-header-height, 30px);
          padding: 0 8px;
          background: var(--gl-header-bg, #3c3836); /* gruvbox bg1 */
          border-bottom: 1px solid var(--gl-header-border, #504945); /* gruvbox bg2 */
          cursor: move;
          user-select: none;
          gap: 8px;
        }
        
        .header:active {
          cursor: grabbing;
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
        }
        
        .panel-type-dropdown:hover {
          background: var(--gl-control-active-bg, #665c54);
        }
        
        .panel-type-dropdown:focus {
          border-color: var(--gl-splitter-active-bg, #fe8019);
        }
        
        .controls {
          margin-left: auto;
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
        }
        
        .menu-button:hover,
        .restore-button:hover {
          background: var(--gl-control-hover-bg, #504945); /* gruvbox bg2 */
          opacity: 1;
        }
        
        .menu-button:active,
        .menu-button.active,
        .restore-button:active {
          background: var(--gl-control-active-bg, #665c54); /* gruvbox bg3 */
        }
        
        .restore-button:hover {
          color: var(--gl-splitter-active-bg, #fe8019); /* gruvbox orange */
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
        }
        
        .dropdown-menu.show {
          display: block;
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
        }
        
        .menu-item:hover {
          background: var(--gl-control-hover-bg, #504945);
        }
        
        .menu-item svg {
          flex-shrink: 0;
        }
        
        .menu-divider {
          height: 1px;
          background: var(--gl-header-border, #504945);
          margin: 4px 0;
        }
        
        .content {
          flex: 1;
          min-height: 0;
          overflow: auto;
          position: relative;
          background: var(--gl-pane-bg, #282828); /* gruvbox bg0 */
        }
        
        ::slotted(*) {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="header" draggable="true">
        <select class="panel-type-dropdown">
          ${panelTypes.map((type: string) => `
            <option value="${type}" ${this._panelType === type ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>
          `).join('')}
        </select>
        <div class="controls">
          ${this._isMaximized ? `
            <button class="restore-button" title="Restore">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 2h5v1M2 2v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          ` : ''}
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
      <div class="content">
        <slot></slot>
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
      const panelTypeDropdown = this.shadowRoot?.querySelector('.panel-type-dropdown') as HTMLSelectElement;

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
        _draggedElement?: HTMLElement;
      };
      if (layout) {
        layout._draggedElement = this;
      }
      
      this.emit('pane-drag-start', { pane: this });
    }
  };

  private handleDragEnd = (): void => {
    this.emit('pane-drag-end', { pane: this });
  };

  private handleMaximize = (): void => {
    this.isMaximized = !this.isMaximized;
    // Re-render to update the restore button visibility
    this.render();
  };

  private handleSplit = (orientation: 'horizontal' | 'vertical'): void => {
    const parent = this.parentElement;
    if (!parent) return;

    // Create a new pane with a copy of this pane's content
    const newPane = document.createElement('gl-pane');
    newPane.setAttribute('panel-type', this._panelType);
    
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
      newPane
    });
  };

  private handleClose = (): void => {
    this.emit('pane-close', { pane: this });
    
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
  };

  private handleDragOver = (e: DragEvent): void => {
    const layout = this.closest('gl-layout') as HTMLElement & { 
      _draggedElement?: HTMLElement;
      _dropIndicator?: { show(target: HTMLElement, position?: string): void; hide(): void };
    };
    
    if (layout?._draggedElement?.tagName === 'GL-PANE') {
      const draggedPane = layout._draggedElement;
      
      // Don't allow dropping on itself
      if (draggedPane === this) {
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'none';
        }
        this.classList.remove('drag-over');
        if (layout._dropIndicator) {
          layout._dropIndicator.hide();
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
      
      let position: 'top' | 'right' | 'bottom' | 'left' = 'top';
      
      // Determine which edge is closest to the cursor
      const edgeThreshold = 0.3; // 30% from edge
      
      if (yRatio < edgeThreshold) {
        position = 'top';
      } else if (yRatio > 1 - edgeThreshold) {
        position = 'bottom';
      } else if (xRatio < edgeThreshold) {
        position = 'left';
      } else if (xRatio > 1 - edgeThreshold) {
        position = 'right';
      }
      
      // Check if this drop would result in no layout change
      if (this.isNoOpDrop(draggedPane as GlPane, position)) {
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'none';
        }
        this.classList.remove('drag-over');
        if (layout._dropIndicator) {
          layout._dropIndicator.hide();
        }
        return;
      }
      
      // Show drop indicator with position
      if (layout._dropIndicator) {
        layout._dropIndicator.show(this, position);
      }
    }
  };

  private handleDragLeave = (e: DragEvent): void => {
    if (e.target === this) {
      this.classList.remove('drag-over');
      
      const layout = this.closest('gl-layout') as HTMLElement & { 
        _dropIndicator?: { hide(): void };
      };
      if (layout?._dropIndicator) {
        layout._dropIndicator.hide();
      }
    }
  };

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    this.classList.remove('drag-over');
    
    const layout = this.closest('gl-layout') as HTMLElement & { 
      _draggedElement?: HTMLElement;
      _dropIndicator?: { hide(): void; position?: string };
    };
    
    const position = layout?._dropIndicator?.position || 'left';
    
    // Hide drop indicator
    if (layout?._dropIndicator) {
      layout._dropIndicator.hide();
    }
    
    const draggedPane = layout?._draggedElement;
    
    if (draggedPane?.tagName === 'GL-PANE' && draggedPane !== this) {
      this.createSplitLayout(draggedPane as GlPane, position as 'top' | 'right' | 'bottom' | 'left');
      
      // Emit event
      this.emit('pane-moved', {
        pane: draggedPane,
        target: this,
        position
      });
    }
  };

  private createSplitLayout(draggedPane: GlPane, position: 'top' | 'right' | 'bottom' | 'left'): void {
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
    const children = Array.from(parent.children).filter(
      child => child.tagName !== 'GL-SPLITTER'
    );
    
    if (children.length === 0 && parent.parentElement) {
      // Parent is empty, remove it
      const grandParent = parent.parentElement;
      parent.remove();
      this.cleanupSplitters(grandParent);
      this.triggerParentResize(grandParent);
    } else if (children.length === 1 && parent.parentElement && 
               (parent.tagName === 'GL-ROW' || parent.tagName === 'GL-COLUMN')) {
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
      console.error(`Invalid panel type "${this._panelType}" for gl-pane. Valid options are: ${panelTypes.join(', ')}`);
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
}

customElements.define('gl-pane', GlPane);