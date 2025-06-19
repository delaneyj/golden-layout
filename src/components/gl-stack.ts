import { BaseElement } from '../core/base-element';
import './gl-header';
import './gl-tab';

export class GlStack extends BaseElement {
  private _activeIndex = 0;
  private _isMaximized = false;

  static get observedAttributes(): string[] {
    return ['active-index'];
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  set activeIndex(value: number) {
    this._activeIndex = value;
    this.setAttribute('active-index', value.toString());
    this.updateActiveTab();
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
    if (name === 'active-index' && newValue !== null) {
      this._activeIndex = Number.parseInt(newValue, 10) || 0;
      this.updateActiveTab();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('tab-clicked', this.handleTabClick);
    this.addEventListener('tab-close-requested', this.handleTabClose);
    this.addEventListener('maximize-requested', this.handleMaximize);
    this.addEventListener('close-requested', this.handleClose);
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
    this.addEventListener('dragleave', this.handleDragLeave);

    // Setup mutation observer to watch for content changes
    this.observeContentChanges();
    
    // Initialize tabs and set first as active
    setTimeout(() => {
      this.updateTabs();
      this.updateActiveTab();
    }, 0);
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
          background: var(--gl-stack-bg, #fff);
          border: 1px solid var(--gl-stack-border, #ccc);
          position: relative;
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
          border-color: var(--gl-stack-drag-over-border, #007bff);
          box-shadow: 0 0 0 2px var(--gl-stack-drag-over-shadow, rgba(0, 123, 255, 0.25));
        }
        
        :host(.drag-over)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gl-stack-drag-over-bg, rgba(0, 123, 255, 0.1));
          pointer-events: none;
          z-index: 10;
          border-radius: inherit;
        }
        
        .content {
          flex: 1;
          overflow: auto;
          position: relative;
        }
        
        ::slotted(gl-component-container) {
          display: none;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        ::slotted(gl-component-container.active) {
          display: block;
        }
      </style>
      <gl-header>
        <slot name="tabs" slot="tabs"></slot>
      </gl-header>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }

  private observeContentChanges(): void {
    let updateTimeout: number | null = null;

    const observer = new MutationObserver((mutations) => {
      // Check if any of the mutations are actual content changes (not tab changes)
      const hasContentChange = mutations.some((mutation) => {
        return (
          Array.from(mutation.addedNodes).some(
            (node) => node instanceof HTMLElement && !node.matches('gl-tab'),
          ) ||
          Array.from(mutation.removedNodes).some(
            (node) => node instanceof HTMLElement && !node.matches('gl-tab'),
          )
        );
      });

      if (hasContentChange) {
        // Debounce updates to ensure all attributes are set
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
          this.updateTabs();
          this.updateActiveTab();
        }, 0);
      }
    });

    observer.observe(this, {
      childList: true,
      subtree: false,
    });
  }

  updateTabs(): void {
    const tabsSlot = this.querySelector('slot[name="tabs"]');
    if (!tabsSlot) {
      // Create tabs from content children
      const contents = Array.from(this.children).filter((child) => !child.hasAttribute('slot'));

      // Clear existing tabs
      this.querySelectorAll('gl-tab').forEach((tab) => tab.remove());

      // Create new tabs
      contents.forEach((content, index) => {
        const tab = document.createElement('gl-tab');
        const title = content.getAttribute('title') || `Tab ${index + 1}`;
        tab.setAttribute('title', title);
        if (index === this._activeIndex) {
          tab.setAttribute('active', '');
        }
        tab.slot = 'tabs';
        this.appendChild(tab);
      });
    }
  }

  updateActiveTab(): void {
    const contents = Array.from(this.children).filter((child) => !child.hasAttribute('slot'));

    const tabs = Array.from(this.querySelectorAll('gl-tab'));

    contents.forEach((content, index) => {
      content.classList.toggle('active', index === this._activeIndex);
    });

    tabs.forEach((tab, index) => {
      if (index === this._activeIndex) {
        tab.setAttribute('active', '');
      } else {
        tab.removeAttribute('active');
      }
    });
  }

  private handleTabClick = (e: Event): void => {
    const tab = e.target as HTMLElement;
    const tabs = Array.from(this.querySelectorAll('gl-tab'));
    const index = tabs.indexOf(tab);

    if (index !== -1) {
      this.activeIndex = index;
      this.emit('tab-changed', { index });
    }
  };

  private handleTabClose = (e: Event): void => {
    const tab = e.target as HTMLElement;
    const tabs = Array.from(this.querySelectorAll('gl-tab'));
    const index = tabs.indexOf(tab);

    if (index !== -1) {
      this.emit('tab-close', { index });

      // Remove the tab and its content
      const contents = Array.from(this.children).filter((child) => !child.hasAttribute('slot'));

      if (contents[index]) {
        contents[index].remove();
      }

      tab.remove();

      // Adjust active index if needed
      if (this._activeIndex >= tabs.length - 1) {
        this.activeIndex = Math.max(0, tabs.length - 2);
      }

      this.updateTabs();
      this.updateActiveTab();
      
      // Check if stack is empty and remove it
      this.checkAndRemoveIfEmpty();
    }
  };

  private handleMaximize = (): void => {
    this.isMaximized = !this.isMaximized;
  };

  private handleClose = (): void => {
    this.emit('stack-close');
    this.remove();
  };

  private handleDragOver = (e: DragEvent): void => {
    // Check if we're dragging a tab
    const layout = this.closest('gl-layout') as HTMLElement & { 
      _draggedElement?: HTMLElement;
      _dropIndicator?: { show(target: HTMLElement, position?: string): void };
    };
    
    if (layout?._draggedElement?.tagName === 'GL-TAB') {
      e.preventDefault();
      e.stopPropagation();
      
      // Add visual feedback
      this.classList.add('drag-over');
      
      // Show drop indicator
      if (layout._dropIndicator) {
        layout._dropIndicator.show(this, 'center');
      }
    }
  };

  private handleDragLeave = (e: DragEvent): void => {
    // Remove visual feedback when drag leaves
    if (e.target === this) {
      this.classList.remove('drag-over');
      
      // Hide drop indicator
      const layout = this.closest('gl-layout') as HTMLElement & { 
        _dropIndicator?: { hide(): void };
      };
      if (layout?._dropIndicator) {
        layout._dropIndicator.hide();
      }
    }
  };

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
      
      // Remove splitter if it's between two splitters
      if (child.tagName === 'GL-SPLITTER' && 
          i > 0 && children[i - 1].tagName === 'GL-SPLITTER') {
        child.remove();
        children.splice(i, 1);
        continue;
      }
      
      i++;
    }
    
    // Redistribute space among remaining children
    this.redistributeSpace(container);
  }
  
  private redistributeSpace(container: Element): void {
    if (container.tagName !== 'GL-ROW' && container.tagName !== 'GL-COLUMN') {
      return;
    }
    
    const children = Array.from(container.children).filter(
      child => child.tagName !== 'GL-SPLITTER'
    ) as HTMLElement[];
    
    if (children.length === 0) return;
    
    // Clear any fixed widths/heights and let flexbox distribute space
    const isRow = container.tagName === 'GL-ROW';
    const sizeAttr = isRow ? 'data-width' : 'data-height';
    
    children.forEach(child => {
      child.removeAttribute(sizeAttr);
      child.style.width = '';
      child.style.height = '';
      child.style.flex = '';
    });
    
    // Trigger resize on the container to recalculate sizes
    if ('updateChildSizes' in container) {
      (container as any).updateChildSizes();
    }
  }

  private checkAndRemoveIfEmpty(): void {
    const contents = Array.from(this.children).filter((child) => !child.hasAttribute('slot'));
    
    if (contents.length === 0) {
      const parent = this.parentElement;
      if (!parent) {
        this.remove();
        return;
      }
      
      const siblings = Array.from(parent.children);
      const stackIndex = siblings.indexOf(this);
      
      // Remove adjacent splitter if exists
      if (stackIndex > 0 && siblings[stackIndex - 1]?.tagName === 'GL-SPLITTER') {
        siblings[stackIndex - 1].remove();
      } else if (stackIndex < siblings.length - 1 && siblings[stackIndex + 1]?.tagName === 'GL-SPLITTER') {
        siblings[stackIndex + 1].remove();
      }
      
      // Remove the empty stack
      this.remove();
      
      // Redistribute space in parent after removal
      this.redistributeSpace(parent);
      
      // Check parent after removal
      const remainingChildren = Array.from(parent.children);
      
      if (parent.tagName === 'GL-ROW' || parent.tagName === 'GL-COLUMN') {
        if (remainingChildren.length === 0) {
          // Parent is now empty, check if we need to clean up grandparent
          const grandParent = parent.parentElement;
          parent.remove();
          
          if (grandParent && (grandParent.tagName === 'GL-ROW' || grandParent.tagName === 'GL-COLUMN')) {
            // Clean up splitters in grandparent
            this.cleanupSplitters(grandParent);
          }
        } else if (remainingChildren.length === 1 && parent.parentElement) {
          // Parent has only one child, replace parent with that child
          const onlyChild = remainingChildren[0];
          const grandParent = parent.parentElement;
          grandParent.replaceChild(onlyChild, parent);
          
          // Clean up splitters in grandparent
          if (grandParent.tagName === 'GL-ROW' || grandParent.tagName === 'GL-COLUMN') {
            this.cleanupSplitters(grandParent);
          }
        }
      }
    }
  }

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    this.classList.remove('drag-over');
    
    const layout = this.closest('gl-layout') as HTMLElement & { 
      _draggedElement?: HTMLElement;
      _dropIndicator?: { hide(): void };
    };
    
    // Hide drop indicator
    if (layout?._dropIndicator) {
      layout._dropIndicator.hide();
    }
    
    const draggedTab = layout?._draggedElement;
    
    if (draggedTab?.tagName === 'GL-TAB') {
      // Find the associated component for this tab
      const sourceStack = draggedTab.closest('gl-stack') as GlStack;
      if (!sourceStack || sourceStack === this) return;
      
      const tabs = Array.from(sourceStack.querySelectorAll('gl-tab'));
      const tabIndex = tabs.indexOf(draggedTab);
      
      if (tabIndex === -1) return;
      
      // Get the component at the same index
      const components = Array.from(sourceStack.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute('slot')
      );
      const component = components[tabIndex];
      
      if (component) {
        // Move the component to this stack
        this.appendChild(component);
        
        // Remove the old tab
        draggedTab.remove();
        
        // Update tabs in both stacks
        sourceStack.updateTabs();
        sourceStack.updateActiveTab();
        this.updateTabs();
        this.updateActiveTab();
        
        // Emit event
        this.emit('component-moved', {
          component,
          from: sourceStack,
          to: this
        });
        
        // Check if source stack is empty and remove it
        sourceStack.checkAndRemoveIfEmpty();
      }
    }
  };
}

customElements.define('gl-stack', GlStack);
