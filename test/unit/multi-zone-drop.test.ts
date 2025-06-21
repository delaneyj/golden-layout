import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { GlPaneElement } from '@/types/elements';
import type { GlDropIndicatorElement, GlLayoutElement } from '@/types/elements';

describe('multi-zone drop', () => {
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
    // Set CSS custom properties
    document.documentElement.style.setProperty('--gl-splitter-size', '5px');

    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up any drop indicators
    document.querySelectorAll('gl-drop-indicator').forEach((el) => el.remove());
  });

  it('detects top drop zone', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Start drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    sourceTab?.dispatchEvent(dragStartEvent);
    layout._draggedElement = sourceTab;

    // Drag over top edge of target
    mockBoundingRect(targetStack);
    const rect = targetStack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    // Manually set clientX/Y as DragEvent constructor doesn't support them
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + rect.width / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + 5, // Near top edge
      writable: false,
    });
    targetStack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check drop indicator shows top position
    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.position).toBe('top');

    const indicator = dropIndicator?.shadowRoot?.querySelector('.indicator');
    expect(indicator?.classList.contains('top')).toBe(true);

    const label = indicator?.querySelector('.label');
    expect(label?.textContent).toBe('Drop to add above');
  });

  it('detects bottom drop zone', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack id="source">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
        <gl-stack id="target">
          <gl-component-container title="Component 2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Start drag
    layout._draggedElement = sourceTab;

    // Drag over bottom edge
    mockBoundingRect(targetStack);
    const rect = targetStack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + rect.width / 2,
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.bottom - 5, // Near bottom edge
      writable: false,
    });
    targetStack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.position).toBe('bottom');
  });

  it('detects left drop zone', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack id="source">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
        <gl-stack id="target">
          <gl-component-container title="Component 2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Start drag
    layout._draggedElement = sourceTab;

    // Drag over left edge
    mockBoundingRect(targetStack);
    const rect = targetStack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.left + 5, // Near left edge
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + rect.height / 2,
      writable: false,
    });
    targetStack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.position).toBe('left');
  });

  it('detects right drop zone', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack id="source">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
        <gl-stack id="target">
          <gl-component-container title="Component 2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Start drag
    layout._draggedElement = sourceTab;

    // Drag over right edge
    mockBoundingRect(targetStack);
    const rect = targetStack.getBoundingClientRect();
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, 'clientX', {
      value: rect.right - 5, // Near right edge
      writable: false,
    });
    Object.defineProperty(dragOverEvent, 'clientY', {
      value: rect.top + rect.height / 2,
      writable: false,
    });
    targetStack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.position).toBe('right');
  });

  it('detects center drop zone', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack id="source">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
        <gl-stack id="target">
          <gl-component-container title="Component 2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Start drag
    layout._draggedElement = sourceTab;

    // Drag over center
    mockBoundingRect(targetStack);
    const rect = targetStack.getBoundingClientRect();
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
    targetStack.dispatchEvent(dragOverEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dropIndicator = document.querySelector('gl-drop-indicator') as GlDropIndicatorElement;
    expect(dropIndicator?.position).toBe('center');
  });

  it('creates vertical split when dropping on top', async () => {
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

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Setup drag
    layout._draggedElement = sourceTab;
    layout._dropIndicator = {
      hide: () => {},
      position: 'top',
      show: () => {},
    };

    // Perform drop
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    targetStack.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check that a column was created
    const column = container.querySelector('gl-column');
    expect(column).toBeTruthy();

    // Check order: new stack, splitter, original stack
    const columnChildren = Array.from(column?.children);
    expect(columnChildren.length).toBe(3);
    expect(columnChildren[0].tagName).toBe('GL-STACK');
    expect(columnChildren[1].tagName).toBe('GL-SPLITTER');
    expect(columnChildren[2].tagName).toBe('GL-STACK');

    // Check splitter orientation
    const splitter = columnChildren[1] as HTMLElement;
    expect(splitter.getAttribute('orientation')).toBe('vertical');
  });

  it('creates horizontal split when dropping on left', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-column>
          <gl-stack id="source">
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="vertical"></gl-splitter>
          <gl-stack id="target">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-column>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as GlLayoutElement;
    const sourceTab = container.querySelector('#source gl-tab');
    const targetStack = container.querySelector('#target') as HTMLElement;

    // Setup drag
    layout._draggedElement = sourceTab;
    layout._dropIndicator = {
      hide: () => {},
      position: 'left',
      show: () => {},
    };

    // Perform drop
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    targetStack.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check that a row was created
    const row = container.querySelector('gl-row');
    expect(row).toBeTruthy();

    // Check order: new stack, splitter, original stack
    const rowChildren = Array.from(row?.children);
    expect(rowChildren.length).toBe(3);
    expect(rowChildren[0].tagName).toBe('GL-STACK');
    expect(rowChildren[1].tagName).toBe('GL-SPLITTER');
    expect(rowChildren[2].tagName).toBe('GL-STACK');

    // Check splitter orientation
    const splitter = rowChildren[1] as HTMLElement;
    expect(splitter.getAttribute('orientation')).toBe('horizontal');
  });
});
