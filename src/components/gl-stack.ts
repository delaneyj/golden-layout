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

    // Setup mutation observer to watch for content changes
    this.observeContentChanges();
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
        
        .content {
          flex: 1;
          overflow: auto;
          position: relative;
        }
        
        ::slotted(*) {
          display: none;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        ::slotted(.active) {
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
      const hasContentChange = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => 
          node instanceof HTMLElement && !node.matches('gl-tab')
        ) || Array.from(mutation.removedNodes).some(node => 
          node instanceof HTMLElement && !node.matches('gl-tab')
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

  private updateTabs(): void {
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

  private updateActiveTab(): void {
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
    }
  };

  private handleMaximize = (): void => {
    this.isMaximized = !this.isMaximized;
  };

  private handleClose = (): void => {
    this.emit('stack-close');
    this.remove();
  };
}

customElements.define('gl-stack', GlStack);
