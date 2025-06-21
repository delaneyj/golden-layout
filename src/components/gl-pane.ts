import { BaseElement } from '../core/base-element';

export class GlPane extends BaseElement {
  private _title = '';
  private _isMaximized = false;

  static get observedAttributes(): string[] {
    return ['title'];
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
    this.setAttribute('title', value);
    this.updateHeader();
  }

  get isMaximized(): boolean {
    return this._isMaximized;
  }

  set isMaximized(value: boolean) {
    this._isMaximized = value;
    this.toggleAttribute('maximized', value);
    this.emit('maximize-changed', { isMaximized: value });
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'title') {
      this._title = newValue || '';
      this.updateHeader();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragleave', this.handleDragLeave);
    
    // Get title from first child if not set
    setTimeout(() => {
      if (!this._title || this._title === '') {
        const firstChild = this.querySelector('gl-component-container');
        if (firstChild) {
          this._title = firstChild.getAttribute('title') || 'Untitled';
          this.updateHeader();
        }
      }
    }, 0);
  }

  protected render(): void {
    if (!this.shadowRoot) {
      console.error('GlPane: No shadow root!');
      return;
    }

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
        }
        
        .header:active {
          cursor: grabbing;
        }
        
        .title {
          font-size: 13px;
          font-weight: 500;
          color: var(--gl-header-color, #ebdbb2); /* gruvbox fg1 */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        
        .controls {
          display: flex;
          gap: 2px;
          margin-left: 8px;
        }
        
        .control {
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
        
        .control:hover {
          background: var(--gl-control-hover-bg, #504945); /* gruvbox bg2 */
          opacity: 1;
        }
        
        .control:active {
          background: var(--gl-control-active-bg, #665c54); /* gruvbox bg3 */
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
        <span class="title">${this._title}</span>
        <div class="controls">
          <button class="control maximize" title="Maximize">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="control close" title="Close">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `;

    // Add event listeners after a microtask to ensure DOM is ready
    setTimeout(() => {
      const header = this.shadowRoot?.querySelector('.header') as HTMLElement;
      const maximizeBtn = this.shadowRoot?.querySelector('.maximize') as HTMLElement;
      const closeBtn = this.shadowRoot?.querySelector('.close') as HTMLElement;

      if (header) {
        header.addEventListener('dragstart', this.handleDragStart);
        header.addEventListener('dragend', this.handleDragEnd);
      }
      if (maximizeBtn) {
        maximizeBtn.addEventListener('click', this.handleMaximize);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', this.handleClose);
      }
    }, 0);
  }

  private updateHeader(): void {
    const titleElement = this.shadowRoot?.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = this._title;
    }
  }

  private handleDragStart = (e: DragEvent): void => {
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
}

customElements.define('gl-pane', GlPane);