import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { TilexDropIndicator } from '@/components/tx-drop-indicator';
import type { TilexPane } from '@/components/tx-pane';
import type { TilexLayoutElement } from '@/types/elements';

// Test-specific interface to access private properties
interface TilexLayoutTestElement extends TilexLayoutElement {
  _draggedElement: HTMLElement | null;
  _dropIndicator: TilexDropIndicator | null;
}

describe('tx-pane', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with title', () => {
    container.innerHTML = `
      <tx-pane title="Test Pane">
        
          <div>Content</div>
        
      </tx-pane>
    `;

    const pane = container.querySelector('tx-pane') as TilexPane;
    expect(pane).toBeTruthy();
    expect(pane.title).toBe('Test Pane');

    const titleElement = pane.shadowRoot?.querySelector('.title');
    expect(titleElement?.textContent).toBe('Test Pane');
  });

  it('gets title from child component if not set', async () => {
    container.innerHTML = `
      <tx-pane>
        
          <div>Content</div>
        
      </tx-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const pane = container.querySelector('tx-pane') as TilexPane;
    const titleElement = pane.shadowRoot?.querySelector('.title');
    expect(titleElement?.textContent).toBe('Component Title');
  });

  it('emits close event when close button clicked', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane title="Test Pane">
          
            <div>Content</div>
          
        </tx-pane>
      </tx-layout>
    `;

    const pane = container.querySelector('tx-pane') as TilexPane;
    let closeEmitted = false;

    pane.addEventListener('pane-close', () => {
      closeEmitted = true;
    });

    const closeBtn = pane.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn.click();

    expect(closeEmitted).toBe(true);
    expect(container.querySelector('tx-pane')).toBeFalsy();
  });

  it('toggles maximize state', () => {
    container.innerHTML = `
      <tx-pane title="Test Pane">
        
          <div>Content</div>
        
      </tx-pane>
    `;

    const pane = container.querySelector('tx-pane') as TilexPane;
    const maximizeBtn = pane.shadowRoot?.querySelector('.maximize') as HTMLElement;

    expect(pane.isMaximized).toBe(false);
    expect(pane.hasAttribute('maximized')).toBe(false);

    maximizeBtn.click();

    expect(pane.isMaximized).toBe(true);
    expect(pane.hasAttribute('maximized')).toBe(true);

    maximizeBtn.click();

    expect(pane.isMaximized).toBe(false);
    expect(pane.hasAttribute('maximized')).toBe(false);
  });

  it('supports drag and drop to create splits', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="pane1" title="Pane 1">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="pane2" title="Pane 2">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    const pane1 = container.querySelector('#pane1') as HTMLElement;
    const pane2 = container.querySelector('#pane2') as HTMLElement;

    // Simulate drag start
    layout._draggedElement = pane1;

    // Mock getBoundingClientRect
    pane2.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Simulate dragover on top edge
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: 100,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: 5, // Top edge
      writable: false,
    });

    pane2.dispatchEvent(dragOverEvent);

    // Should show drag-over class
    expect(pane2.classList.contains('drag-over')).toBe(true);

    // Simulate drop
    layout._dropIndicator = { hide: () => {}, position: 'top' };
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    pane2.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should create a column with pane1 on top
    const column = container.querySelector('tx-column');
    expect(column).toBeTruthy();

    const columnChildren = Array.from(column?.children);
    expect(columnChildren.length).toBe(3);
    expect(columnChildren[0].id).toBe('pane1');
    expect(columnChildren[1].tagName).toBe('TX-SPLITTER');
    expect(columnChildren[2].id).toBe('pane2');
  });
});
