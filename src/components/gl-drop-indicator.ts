import { BaseElement } from '../core/base-element';

export class GlDropIndicator extends BaseElement {
  private _targetElement: HTMLElement | null = null;
  private _position: 'center' | 'top' | 'right' | 'bottom' | 'left' = 'center';
  
  get position(): string {
    return this._position;
  }

  static get observedAttributes(): string[] {
    return [];
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          pointer-events: none;
          z-index: 999;
          display: none !important;
        }
        
        :host([data-visible="true"]) {
          display: block !important;
        }
        
        .indicator {
          position: absolute;
          background: var(--gl-drop-indicator-bg, rgba(0, 123, 255, 0.2));
          border: 2px solid var(--gl-drop-indicator-border, #007bff);
          border-radius: var(--gl-drop-indicator-radius, 4px);
          transition: all 0.2s ease;
        }
        
        .indicator.center {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .indicator.top {
          top: 0;
          left: 0;
          right: 0;
          height: 30%;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        
        .indicator.bottom {
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
        
        .indicator.left {
          top: 0;
          left: 0;
          bottom: 0;
          width: 30%;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
        
        .indicator.right {
          top: 0;
          right: 0;
          bottom: 0;
          width: 30%;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        
        .label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--gl-drop-indicator-label-bg, #007bff);
          color: var(--gl-drop-indicator-label-color, white);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      </style>
      <div class="indicator center">
        <div class="label">Drop here</div>
      </div>
    `;
  }

  show(target: HTMLElement, position: 'center' | 'top' | 'right' | 'bottom' | 'left' = 'center'): void {
    this._targetElement = target;
    this._position = position;
    
    const rect = target.getBoundingClientRect();
    this.setAttribute('data-visible', 'true');
    this.style.left = `${rect.left}px`;
    this.style.top = `${rect.top}px`;
    this.style.width = `${rect.width}px`;
    this.style.height = `${rect.height}px`;
    
    const indicator = this.shadowRoot?.querySelector('.indicator');
    if (indicator) {
      indicator.className = `indicator ${position}`;
      
      // Update label based on position
      const label = indicator.querySelector('.label') as HTMLElement;
      if (label) {
        switch (position) {
          case 'top':
            label.textContent = 'Drop to add above';
            break;
          case 'bottom':
            label.textContent = 'Drop to add below';
            break;
          case 'left':
            label.textContent = 'Drop to add left';
            break;
          case 'right':
            label.textContent = 'Drop to add right';
            break;
          default:
            label.textContent = 'Drop here';
        }
      }
    }
  }

  hide(): void {
    this.removeAttribute('data-visible');
    this._targetElement = null;
  }
}

customElements.define('gl-drop-indicator', GlDropIndicator);