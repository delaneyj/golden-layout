import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { GlLayoutElement } from '@/types/elements';

// Test-specific interfaces to access private properties
interface GlLayoutTestElement extends GlLayoutElement {
  _draggedElement: HTMLElement | null;
}

interface GlDropIndicatorTestElement extends HTMLElement {
  position: string;
}

describe('self-target prevention', () => {
  let container: HTMLElement;

  const mockBoundingRect = (element: HTMLElement, x = 0, y = 0, width = 200, height = 200) => {
    element.getBoundingClientRect = () => ({
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      width,
      height,
      x,
      y,
      toJSON: () => {},
    });
  };

  beforeEach(() => {
    document.documentElement.style.setProperty('--gl-splitter-size', '5px');

    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.querySelectorAll('gl-drop-indicator').forEach((el) => el.remove());
  });

  it('prevents center drop on same stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane id="stack1">
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack = container.querySelector('#stack1') as HTMLElement;
    const tab = stack.querySelector('gl-tab');

    // Start drag from same stack
    layout._draggedElement = tab;

    // Mock the stack's bounding rect
    mockBoundingRect(stack);

    // Drag over center of same stack
    const rect = stack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + rect.width / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + rect.height / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { dropEffect: 'move' },
      writable: false,
    });

    stack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Drop indicator should not be visible
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);

    // Stack should not have drag-over class
    expect(stack.classList.contains('drag-over')).toBe(false);
  });

  it('prevents edge drop on same stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane id="stack1">
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack = container.querySelector('#stack1') as HTMLElement;
    const tab = stack.querySelector('gl-tab');

    // Start drag from same stack
    layout._draggedElement = tab;

    // Mock the stack's bounding rect
    mockBoundingRect(stack);

    // Drag over top edge of same stack
    const rect = stack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + rect.width / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + 5, // Near top edge
      writable: false,
    });

    stack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Drop indicator should not be visible
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorTestElement;
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);

    // Stack should not have drag-over class
    expect(stack.classList.contains('drag-over')).toBe(false);
  });

  it('allows center drop on different stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-pane id="stack1">
            
              <div>Content 1</div>
            
          </gl-pane>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-pane id="stack2">
            
              <div>Content 2</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab;

    // Mock stack2's bounding rect
    mockBoundingRect(stack2);

    // Drag over center of different stack
    const rect = stack2.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + rect.width / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + rect.height / 2,
      writable: false,
    });

    stack2.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Drop indicator should be visible with center position
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorTestElement;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');
    expect(dropIndicator?.position).toBe('center');

    // Stack should have drag-over class
    expect(stack2.classList.contains('drag-over')).toBe(true);
  });

  it('prevents any drop position on same stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane id="stack1">
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack = container.querySelector('#stack1') as HTMLElement;
    const tab = stack.querySelector('gl-tab');

    // Start drag from same stack
    layout._draggedElement = tab;
    mockBoundingRect(stack);

    // Test all drop positions
    const positions = [
      { x: 100, y: 5, name: 'top' }, // Top edge
      { x: 195, y: 100, name: 'right' }, // Right edge
      { x: 100, y: 195, name: 'bottom' }, // Bottom edge
      { x: 5, y: 100, name: 'left' }, // Left edge
      { x: 100, y: 100, name: 'center' }, // Center
    ];

    for (const pos of positions) {
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragOverEvent, 'clientX', {
        value: pos.x,
        writable: false,
      });
      Object.defineProperty(dragOverEvent, 'clientY', {
        value: pos.y,
        writable: false,
      });
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: { dropEffect: 'move' },
        writable: false,
      });

      stack.dispatchEvent(dragOverEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Drop indicator should never be visible for same stack
      const dropIndicator = document.querySelector('gl-drop-indicator');
      expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);

      // Stack should never have drag-over class for same stack
      expect(stack.classList.contains('drag-over')).toBe(false);
    }
  });
});
