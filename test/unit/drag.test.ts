import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';
import type { TilexLayoutElement } from '@/types/elements';

// Test-specific interface to access private properties
interface TilexLayoutTestElement extends TilexLayoutElement {
  _draggedElement: HTMLElement | null;
}

describe('drag and drop', () => {
  let container: HTMLElement;
  let dragSource: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create a drag source element
    dragSource = document.createElement('div');
    dragSource.id = 'dragSrc';
    dragSource.setAttribute('draggable', 'true');
    dragSource.textContent = 'Drag me';
    document.body.appendChild(dragSource);
  });

  afterEach(() => {
    container.remove();
    dragSource.remove();
  });

  it('handles drag start event on draggable elements', async () => {
    const dragStartHandler = vi.fn();

    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    const layout = container.querySelector('tx-layout');
    layout?.addEventListener('item-drag-start', dragStartHandler);

    // Get a tab which is draggable
    await new Promise((resolve) => setTimeout(resolve, 50));
    const tab = container.querySelector('tx-tab');

    // Simulate drag start
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });

    tab?.dispatchEvent(dragStartEvent);

    expect(dragStartHandler).toHaveBeenCalledTimes(1);
    expect(dragStartHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          element: tab,
        }),
      }),
    );
  });

  it('handles drag over event', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const firstTab = container.querySelector('tx-tab');

    // Start drag
    const dataTransfer = new DataTransfer();
    dataTransfer.effectAllowed = 'move';

    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer,
    });

    firstTab?.dispatchEvent(dragStartEvent);

    // Drag over the layout (which handles dragover)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });

    // Mock the dataTransfer since it's read-only in the event
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: {
        effectAllowed: 'move',
        dropEffect: '',
      },
      writable: true,
    });

    const preventDefault = vi.spyOn(dragOverEvent, 'preventDefault');
    layout?.dispatchEvent(dragOverEvent);

    // Should prevent default to allow drop
    expect(preventDefault).toHaveBeenCalled();
  });

  it('handles drop event on layout', async () => {
    const itemDroppedHandler = vi.fn();

    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutTestElement;
    layout?.addEventListener('item-dropped', itemDroppedHandler);

    const tabs = container.querySelectorAll('tx-tab');
    const firstTab = tabs[0];

    // Simulate dragging first tab
    const dataTransfer = new DataTransfer();
    dataTransfer.effectAllowed = 'move';

    // Start drag on first tab
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer,
    });
    firstTab?.dispatchEvent(dragStartEvent);

    // Simulate layout handling the drag
    layout._draggedElement = firstTab;

    // Drop on layout (not on another tab - our implementation doesn't support tab reordering)
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      dataTransfer,
    });

    // Create a mock target element
    const mockTarget = document.createElement('div');
    Object.defineProperty(dropEvent, 'target', {
      value: mockTarget,
      writable: false,
    });

    layout?.dispatchEvent(dropEvent);

    expect(itemDroppedHandler).toHaveBeenCalledTimes(1);
    expect(itemDroppedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          draggedElement: firstTab,
          targetElement: mockTarget,
        }),
      }),
    );
  });

  it('handles drag end event', async () => {
    const dragEndHandler = vi.fn();

    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    layout?.addEventListener('item-drag-end', dragEndHandler);

    const tab = container.querySelector('tx-tab');

    // Simulate drag operations
    const dataTransfer = new DataTransfer();
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer,
    });
    tab?.dispatchEvent(dragStartEvent);

    // End drag
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
    });
    tab?.dispatchEvent(dragEndEvent);

    expect(dragEndHandler).toHaveBeenCalledTimes(1);
  });
});
