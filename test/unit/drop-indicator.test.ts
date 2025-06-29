import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';
import type { TilexDropIndicator } from '@/components/tx-drop-indicator';
import type { TilexLayoutElement } from '@/types/elements';

// Test-specific interface to access private properties
interface TilexLayoutTestElement extends TilexLayoutElement {
  _draggedElement: HTMLElement | null;
  _dropIndicator: TilexDropIndicator | null;
}

describe('drop indicator', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up any drop indicators
    document.querySelectorAll('tx-drop-indicator').forEach((el) => el.remove());
  });

  it('creates drop indicator when layout is connected', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Drop indicator should be created
    const dropIndicator = document.querySelector('tx-drop-indicator');
    expect(dropIndicator).toBeTruthy();
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
  });

  it('shows drop indicator when dragging over stack', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="source">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="target">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    const sourceTab = container.querySelector('#source tx-tab');
    const targetStack = container.querySelector('#target');

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    sourceTab?.dispatchEvent(dragStartEvent);
    layout._draggedElement = sourceTab;

    // Drag over target
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Drop indicator should be visible
    const dropIndicator = document.querySelector('tx-drop-indicator') as TilexDropIndicator;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');

    // Drop indicator should be positioned over target
    const targetRect = targetStack?.getBoundingClientRect();
    if (targetRect) {
      expect(dropIndicator?.style.left).toBe(`${targetRect.left}px`);
      expect(dropIndicator?.style.top).toBe(`${targetRect.top}px`);
      expect(dropIndicator?.style.width).toBe(`${targetRect.width}px`);
      expect(dropIndicator?.style.height).toBe(`${targetRect.height}px`);
    }
  });

  it('hides drop indicator on drag leave', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="source">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="target">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    const tab = container.querySelector('#source tx-tab');
    const stack = container.querySelector('#target');

    // Setup drag from different stack
    layout._draggedElement = tab;

    // Show drop indicator
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    stack?.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('tx-drop-indicator') as TilexDropIndicator;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');

    // Drag leave
    const dragLeaveEvent = new DragEvent('dragleave', {
      bubbles: true,
    });
    Object.defineProperty(dragLeaveEvent, 'target', {
      value: stack,
      writable: false,
    });
    stack?.dispatchEvent(dragLeaveEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Drop indicator should be hidden
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
  });

  it('hides drop indicator on drag end', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    const tab = container.querySelector('tx-tab');

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    tab?.dispatchEvent(dragStartEvent);

    // Show drop indicator
    const stack = container.querySelector('tx-pane');
    if (stack && layout._dropIndicator) {
      layout._dropIndicator.show(stack);
    }

    const dropIndicator = document.querySelector('tx-drop-indicator') as TilexDropIndicator;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');

    // End drag
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
    });
    tab?.dispatchEvent(dragEndEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Drop indicator should be hidden
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
  });

  it('displays correct label text based on position', () => {
    const dropIndicator = document.createElement('tx-drop-indicator') as TilexDropIndicator;
    document.body.appendChild(dropIndicator);

    const target = document.createElement('div');
    target.style.position = 'fixed';
    target.style.left = '100px';
    target.style.top = '100px';
    target.style.width = '200px';
    target.style.height = '200px';
    document.body.appendChild(target);

    // Test center position
    dropIndicator.show(target, 'center');
    let label = dropIndicator.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe('Drop here');

    // Test top position
    dropIndicator.show(target, 'top');
    label = dropIndicator.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe('Drop to add above');

    // Test bottom position
    dropIndicator.show(target, 'bottom');
    label = dropIndicator.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe('Drop to add below');

    // Test left position
    dropIndicator.show(target, 'left');
    label = dropIndicator.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe('Drop to add left');

    // Test right position
    dropIndicator.show(target, 'right');
    label = dropIndicator.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe('Drop to add right');

    target.remove();
  });

  it('hides drop indicator after successful drop', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="source">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="target">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    const sourceTab = container.querySelector('#source tx-tab');
    const targetStack = container.querySelector('#target');

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    sourceTab?.dispatchEvent(dragStartEvent);
    layout._draggedElement = sourceTab;

    // Drag over target - should show indicator
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('tx-drop-indicator') as TilexDropIndicator;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');

    // Drop - should hide indicator
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Drop indicator should be hidden after drop
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
  });
});
