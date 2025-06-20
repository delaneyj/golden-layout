import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { GlPane } from '@/components/gl-pane';

describe('gl-pane', () => {
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
      <gl-pane title="Test Pane">
        <gl-component-container>
          <div>Content</div>
        </gl-component-container>
      </gl-pane>
    `;

    const pane = container.querySelector('gl-pane') as GlPane;
    expect(pane).toBeTruthy();
    expect(pane.title).toBe('Test Pane');
    
    const titleElement = pane.shadowRoot?.querySelector('.title');
    expect(titleElement?.textContent).toBe('Test Pane');
  });

  it('gets title from child component if not set', async () => {
    container.innerHTML = `
      <gl-pane>
        <gl-component-container title="Component Title">
          <div>Content</div>
        </gl-component-container>
      </gl-pane>
    `;

    await new Promise(resolve => setTimeout(resolve, 10));

    const pane = container.querySelector('gl-pane') as GlPane;
    const titleElement = pane.shadowRoot?.querySelector('.title');
    expect(titleElement?.textContent).toBe('Component Title');
  });

  it('emits close event when close button clicked', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane title="Test Pane">
          <gl-component-container>
            <div>Content</div>
          </gl-component-container>
        </gl-pane>
      </gl-layout>
    `;

    const pane = container.querySelector('gl-pane') as GlPane;
    let closeEmitted = false;
    
    pane.addEventListener('pane-close', () => {
      closeEmitted = true;
    });

    const closeBtn = pane.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn.click();

    expect(closeEmitted).toBe(true);
    expect(container.querySelector('gl-pane')).toBeFalsy();
  });

  it('toggles maximize state', () => {
    container.innerHTML = `
      <gl-pane title="Test Pane">
        <gl-component-container>
          <div>Content</div>
        </gl-component-container>
      </gl-pane>
    `;

    const pane = container.querySelector('gl-pane') as GlPane;
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
      <gl-layout>
        <gl-row>
          <gl-pane id="pane1" title="Pane 1">
            <gl-component-container>
              <div>Content 1</div>
            </gl-component-container>
          </gl-pane>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-pane id="pane2" title="Pane 2">
            <gl-component-container>
              <div>Content 2</div>
            </gl-component-container>
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise(resolve => setTimeout(resolve, 10));

    const layout = container.querySelector('gl-layout') as any;
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
      toJSON: () => {}
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

    await new Promise(resolve => setTimeout(resolve, 10));

    // Should create a column with pane1 on top
    const column = container.querySelector('gl-column');
    expect(column).toBeTruthy();
    
    const columnChildren = Array.from(column!.children);
    expect(columnChildren.length).toBe(3);
    expect(columnChildren[0].id).toBe('pane1');
    expect(columnChildren[1].tagName).toBe('GL-SPLITTER');
    expect(columnChildren[2].id).toBe('pane2');
  });
});