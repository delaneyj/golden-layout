import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';
import type { GlDropIndicator } from '@/components/gl-drop-indicator';

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
    document.querySelectorAll('gl-drop-indicator').forEach(el => el.remove());
  });

  it('creates drop indicator when layout is connected', async () => {
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

    // Drop indicator should be created
    const dropIndicator = document.querySelector('gl-drop-indicator');
    expect(dropIndicator).toBeTruthy();
    expect(dropIndicator?.hasAttribute('data-visible')).toBe(false);
  });

  it('shows drop indicator when dragging over stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="source">
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="target">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as any;
    const sourceTab = container.querySelector('#source gl-tab');
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
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicator;
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
      <gl-layout>
        <gl-stack id="stack">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as any;
    const tab = container.querySelector('gl-tab');
    const stack = container.querySelector('#stack');

    // Setup drag
    layout._draggedElement = tab;

    // Show drop indicator
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    stack?.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicator;
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
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as any;
    const tab = container.querySelector('gl-tab');

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    tab?.dispatchEvent(dragStartEvent);

    // Show drop indicator
    layout._dropIndicator?.show(container.querySelector('gl-stack')!);

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicator;
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
    const dropIndicator = document.createElement('gl-drop-indicator') as GlDropIndicator;
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
      <gl-layout>
        <gl-row>
          <gl-stack id="source">
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="target">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as any;
    const sourceTab = container.querySelector('#source gl-tab');
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

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicator;
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