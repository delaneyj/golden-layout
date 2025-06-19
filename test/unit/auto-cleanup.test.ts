import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';

describe('auto cleanup empty containers', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('removes empty stack when last component is closed', async () => {
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

    const stack1 = container.querySelector('#stack1');
    const row = container.querySelector('gl-row');
    const tab = stack1?.querySelector('gl-tab');

    // Close the only tab in stack1
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack1 should be removed
    expect(container.querySelector('#stack1')).toBeNull();
    
    // Check if row still exists
    const rowAfter = container.querySelector('gl-row');
    const layoutChildren = container.querySelector('gl-layout')?.children;
    
    if (rowAfter) {
      // Row still exists
      expect(rowAfter.querySelectorAll('gl-splitter').length).toBe(0);
      expect(rowAfter.children.length).toBe(1);
      expect(rowAfter.children[0].id).toBe('stack2');
    } else {
      // Row was replaced by stack2
      expect(layoutChildren?.length).toBe(1);
      expect(layoutChildren?.[0].id).toBe('stack2');
    }
  });

  it('removes row/column when it becomes empty', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row id="main-row">
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-stack');
    const tab = stack?.querySelector('gl-tab');

    // Close the only tab
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack should be removed
    expect(container.querySelector('gl-stack')).toBeNull();
    
    // Row should also be removed since it's empty
    expect(container.querySelector('#main-row')).toBeNull();
  });

  it('replaces row/column with only child when one child remains', async () => {
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

    const layout = container.querySelector('gl-layout');
    const stack1 = container.querySelector('#stack1');
    const tab = stack1?.querySelector('gl-tab');

    // Close the tab in stack1
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Row should be replaced by stack2
    expect(container.querySelector('gl-row')).toBeNull();
    expect(layout?.children.length).toBe(1);
    expect(layout?.children[0].id).toBe('stack2');
  });

  it('removes empty stack after drag and drop', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="source">
            <gl-component-container title="Component 1" id="comp1">
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
    const sourceStack = container.querySelector('#source') as any;
    const targetStack = container.querySelector('#target');
    const tab = sourceStack?.querySelector('gl-tab');

    // Simulate drag and drop
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });
    tab?.dispatchEvent(dragStartEvent);
    layout._draggedElement = tab;

    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    targetStack?.dispatchEvent(dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Source stack should be removed
    expect(container.querySelector('#source')).toBeNull();
    
    // Splitter should be removed
    expect(container.querySelectorAll('gl-splitter').length).toBe(0);
    
    // Only target stack should remain
    expect(layout?.children.length).toBe(1);
    expect(layout?.children[0].id).toBe('target');
  });

  it('handles nested empty container cleanup', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-stack id="nested-stack">
              <gl-component-container title="Component 1">
                <div>Content 1</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="other-stack">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const nestedStack = container.querySelector('#nested-stack');
    const tab = nestedStack?.querySelector('gl-tab');

    // Close the tab in nested stack
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Nested stack should be removed
    expect(container.querySelector('#nested-stack')).toBeNull();
    
    // Column should be removed
    expect(container.querySelector('gl-column')).toBeNull();
    
    // Check the final structure
    const layout = container.querySelector('gl-layout');
    const remainingRow = container.querySelector('gl-row');
    
    if (remainingRow) {
      // Row still exists with only other-stack
      expect(remainingRow.querySelectorAll('gl-splitter').length).toBe(0);
      expect(remainingRow.children.length).toBe(1);
      expect(remainingRow.children[0].id).toBe('other-stack');
    } else {
      // Row was replaced by other-stack
      expect(layout?.children.length).toBe(1);
      expect(layout?.children[0].id).toBe('other-stack');
    }
  });
});