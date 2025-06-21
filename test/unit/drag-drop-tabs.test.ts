import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';
import type { GlLayoutElement } from '@/types/elements';

describe('drag and drop tabs between stacks', () => {
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

  it('moves component when tab is dragged to another stack', async () => {
    const componentMovedHandler = vi.fn();

    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-pane id="source-stack">
            
              <div>Content 1</div>
            
            
              <div>Content 2</div>
            
          </gl-pane>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-pane id="target-stack">
            
              <div>Content 3</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceStack = container.querySelector('#source-stack');
    const targetStack = container.querySelector('#target-stack');
    targetStack?.addEventListener('component-moved', componentMovedHandler);

    // Get the first tab from source stack
    const firstTab = sourceStack?.querySelector('gl-tab');
    const comp1 = container.querySelector('#comp1');

    // Simulate drag start
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    firstTab?.dispatchEvent(dragStartEvent);

    // Set the dragged element on layout
    layout.draggedElement = firstTab as HTMLElement;

    // Simulate drag over target stack
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dragOverEvent);

    // Simulate drop on target stack
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dropEvent);

    // Wait for updates
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify component was moved
    expect(comp1?.parentElement).toBe(targetStack);
    expect(sourceStack?.querySelectorAll('gl-component-container').length).toBe(1);
    expect(targetStack?.querySelectorAll('gl-component-container').length).toBe(2);

    // Verify tabs were updated
    expect(sourceStack?.querySelectorAll('gl-tab').length).toBe(1);
    expect(targetStack?.querySelectorAll('gl-tab').length).toBe(2);

    // Verify event was emitted
    expect(componentMovedHandler).toHaveBeenCalledTimes(1);
    expect(componentMovedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          component: comp1,
          from: sourceStack,
          to: targetStack,
        }),
      }),
    );
  });

  it('shows visual feedback during drag over', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-pane id="source">
            
              <div>Drag me</div>
            
          </gl-pane>
          <gl-pane id="target">
            
              <div>Drop here</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceStack = container.querySelector('#source');
    const targetStack = container.querySelector('#target');
    const tab = sourceStack?.querySelector('gl-tab');

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    tab?.dispatchEvent(dragStartEvent);
    layout.draggedElement = tab as HTMLElement;

    // Verify tab has dragging class
    expect(tab?.classList.contains('dragging')).toBe(true);

    // Drag over target
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dragOverEvent);

    // Verify target has drag-over class
    expect(targetStack?.classList.contains('drag-over')).toBe(true);

    // Drag leave
    const dragLeaveEvent = new DragEvent('dragleave', {
      bubbles: true,
    });
    Object.defineProperty(dragLeaveEvent, 'target', {
      value: targetStack,
      writable: false,
    });
    targetStack?.dispatchEvent(dragLeaveEvent);

    // Verify drag-over class is removed
    expect(targetStack?.classList.contains('drag-over')).toBe(false);

    // End drag
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
    });
    tab?.dispatchEvent(dragEndEvent);

    // Verify dragging class is removed
    expect(tab?.classList.contains('dragging')).toBe(false);
  });

  it('does not move tab when dropped on same stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane id="stack">
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack = container.querySelector('#stack');
    const firstTab = stack?.querySelector('gl-tab');

    // Simulate dragging tab within same stack
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    firstTab?.dispatchEvent(dragStartEvent);
    layout.draggedElement = firstTab as HTMLElement;

    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    stack?.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify nothing changed
    expect(stack?.querySelectorAll('gl-component-container').length).toBe(2);
    expect(stack?.querySelectorAll('gl-tab').length).toBe(2);
  });
});
