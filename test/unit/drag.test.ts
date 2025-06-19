import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';

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
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    const layout = container.querySelector('gl-layout');
    layout?.addEventListener('item-drag-start', dragStartHandler);

    // Get a tab which is draggable
    await new Promise((resolve) => setTimeout(resolve, 50));
    const tab = container.querySelector('gl-tab');

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
      <gl-layout>
        <gl-row>
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-stack>
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const firstTab = container.querySelector('gl-tab');

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

  it('handles drop event and reorders tabs', async () => {
    const itemDroppedHandler = vi.fn();

    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
          <gl-component-container title="Component 2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    layout?.addEventListener('item-dropped', itemDroppedHandler);

    const tabs = container.querySelectorAll('gl-tab');
    const firstTab = tabs[0];
    const secondTab = tabs[1];

    // Simulate dragging first tab to second tab position
    const dataTransfer = new DataTransfer();
    dataTransfer.effectAllowed = 'move';

    // Start drag on first tab
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer,
    });
    firstTab?.dispatchEvent(dragStartEvent);

    // Drop on second tab
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      dataTransfer,
    });
    secondTab?.dispatchEvent(dropEvent);

    expect(itemDroppedHandler).toHaveBeenCalledTimes(1);
    expect(itemDroppedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          draggedElement: firstTab,
          targetElement: secondTab,
        }),
      }),
    );
  });

  it('handles drag end event', async () => {
    const dragEndHandler = vi.fn();

    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    layout?.addEventListener('item-drag-end', dragEndHandler);

    const tab = container.querySelector('gl-tab');

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
