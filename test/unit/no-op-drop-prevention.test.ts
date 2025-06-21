import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { GlDropIndicatorElement, GlLayoutElement } from '@/types/elements';

describe('no-op drop prevention', () => {
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

  it('prevents drop on left edge of next sibling in row', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Try to drop on left edge of stack2 (next sibling)
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
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { dropEffect: 'move' },
      writable: false,
    });

    stack2.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not show drop indicator (no-op)
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
    expect(stack2.classList.contains('drag-over')).toBe(false);
  });

  it('prevents drop on right edge of previous sibling in row', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab2 = stack2.querySelector('gl-tab');

    // Start drag from stack2
    layout._draggedElement = tab2;
    mockBoundingRect(stack1);

    // Try to drop on right edge of stack1 (previous sibling)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: 195, // Right edge
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: 100,
      writable: false,
    });

    stack1.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not show drop indicator (no-op)
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
    expect(stack1.classList.contains('drag-over')).toBe(false);
  });

  it('prevents drop on top edge of next sibling in column', async () => {
    container.innerHTML = `
      <gl-layout>
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
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Try to drop on top edge of stack2 (next sibling)
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

    // Should not show drop indicator (no-op)
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
    expect(stack2.classList.contains('drag-over')).toBe(false);
  });

  it('prevents drop on bottom edge of previous sibling in column', async () => {
    container.innerHTML = `
      <gl-layout>
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
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab2 = stack2.querySelector('gl-tab');

    // Start drag from stack2
    layout._draggedElement = tab2;
    mockBoundingRect(stack1);

    // Try to drop on bottom edge of stack1 (previous sibling)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: 100,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: 195, // Bottom edge
      writable: false,
    });

    stack1.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not show drop indicator (no-op)
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
    expect(stack1.classList.contains('drag-over')).toBe(false);
  });

  it('allows meaningful drops that change layout', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack3 = container.querySelector('#stack3') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack3);

    // Drop on left edge of stack3 (not adjacent, would change layout)
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

    stack3.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should show drop indicator (meaningful change)
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');
    expect(dropIndicator?.position).toBe('left');
    expect(stack3.classList.contains('drag-over')).toBe(true);
  });

  it('allows center drops between siblings', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1 = stack1.querySelector('gl-tab');

    // Start drag from stack1
    layout._draggedElement = tab1;
    mockBoundingRect(stack2);

    // Drop in center of stack2 (always allowed for different stacks)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: 100, // Center
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: 100, // Center
      writable: false,
    });

    stack2.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should show drop indicator (center drops always allowed between different stacks)
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.getAttribute('data-visible')).toBe('true');
    expect(dropIndicator?.position).toBe('center');
    expect(stack2.classList.contains('drag-over')).toBe(true);
  });
});
