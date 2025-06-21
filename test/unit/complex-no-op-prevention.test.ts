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

describe('complex no-op drop prevention', () => {
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

  it('allows drops that would create new structure even between siblings', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="stack1">
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="stack2">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Try to drop on top edge of stack2 (would create a column within the row)
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

    stack2.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should show drop indicator (creates new structure)
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorTestElement;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');
    expect(dropIndicator?.position).toBe('top');
    expect(stack2.classList.contains('drag-over')).toBe(true);
  });

  it('handles nested layouts correctly', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-stack id="stack1">
              <gl-component-container title="Component 1">
                <div>Content 1</div>
              </gl-component-container>
            </gl-stack>
            <gl-splitter orientation="vertical"></gl-splitter>
            <gl-stack id="stack2">
              <gl-component-container title="Component 2">
                <div>Content 2</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="stack3">
            <gl-component-container title="Component 3">
              <div>Content 3</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const stack3 = container.querySelector('#stack3') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Stack1 and stack2 are siblings in a column
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Try to drop on top edge of stack2 (no-op for column siblings)
    let dragOverEvent = new DragEvent('dragover', {
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

    stack2.dispatchEvent(dragOverEvent);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not show drop indicator (no-op)
    let dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);

    // But dropping on stack3 (different parent) should work
    mockBoundingRect(stack3);
    dragOverEvent = new DragEvent('dragover', {
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

    stack3.dispatchEvent(dragOverEvent);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should show drop indicator (different parent)
    dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorTestElement;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');
    expect(dropIndicator?.position).toBe('top');
  });

  it('prevents no-op with multiple splitters between', async () => {
    // Even with splitters, the logical position matters
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="stack1">
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-splitter orientation="horizontal"></gl-splitter> <!-- Double splitter -->
          <gl-stack id="stack2">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutTestElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Try to drop on left edge of stack2 (still next logical sibling)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: 5, // Left edge
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: 100,
      writable: false,
    });

    stack2.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not show drop indicator (no-op)
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
    expect(stack2.classList.contains('drag-over')).toBe(false);
  });
});
