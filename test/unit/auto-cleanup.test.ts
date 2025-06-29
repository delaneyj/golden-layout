import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { TilexLayoutElement } from '@/types/elements';

// Test-specific interface to access private properties
interface TilexLayoutTestElement extends TilexLayoutElement {
  _draggedElement: HTMLElement | null;
}

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
      <tx-layout>
        <tx-row>
          <tx-pane id="stack1">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="stack2">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack1 = container.querySelector('#stack1');
    const _row = container.querySelector('tx-row');
    const tab = stack1?.querySelector('tx-tab');

    // Close the only tab in stack1
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack1 should be removed
    expect(container.querySelector('#stack1')).toBeNull();

    // Check if row still exists
    const rowAfter = container.querySelector('tx-row');
    const layoutChildren = container.querySelector('tx-layout')?.children;

    if (rowAfter) {
      // Row still exists
      expect(rowAfter.querySelectorAll('tx-splitter').length).toBe(0);
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
      <tx-layout>
        <tx-row id="main-row">
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('tx-pane');
    const tab = stack?.querySelector('tx-tab');

    // Close the only tab
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack should be removed
    expect(container.querySelector('tx-pane')).toBeNull();

    // Row should also be removed since it's empty
    expect(container.querySelector('#main-row')).toBeNull();
  });

  it('replaces row/column with only child when one child remains', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="stack1">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="stack2">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const stack1 = container.querySelector('#stack1');
    const tab = stack1?.querySelector('tx-tab');

    // Close the tab in stack1
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Row should be replaced by stack2
    expect(container.querySelector('tx-row')).toBeNull();
    expect(layout?.children.length).toBe(1);
    expect(layout?.children[0].id).toBe('stack2');
  });

  it('removes empty stack after drag and drop', async () => {
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
    const sourceStack = container.querySelector('#source') as HTMLElement;
    const targetStack = container.querySelector('#target');
    const tab = sourceStack?.querySelector('tx-tab');

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
    expect(container.querySelectorAll('tx-splitter').length).toBe(0);

    // Only target stack should remain
    expect(layout?.children.length).toBe(1);
    expect(layout?.children[0].id).toBe('target');
  });

  it('handles nested empty container cleanup', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-pane id="nested-stack">
              
                <div>Content 1</div>
              
            </tx-pane>
          </tx-column>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="other-stack">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const nestedStack = container.querySelector('#nested-stack');
    const tab = nestedStack?.querySelector('tx-tab');

    // Close the tab in nested stack
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Nested stack should be removed
    expect(container.querySelector('#nested-stack')).toBeNull();

    // Column should be removed
    expect(container.querySelector('tx-column')).toBeNull();

    // Check the final structure
    const layout = container.querySelector('tx-layout');
    const remainingRow = container.querySelector('tx-row');

    if (remainingRow) {
      // Row still exists with only other-stack
      expect(remainingRow.querySelectorAll('tx-splitter').length).toBe(0);
      expect(remainingRow.children.length).toBe(1);
      expect(remainingRow.children[0].id).toBe('other-stack');
    } else {
      // Row was replaced by other-stack
      expect(layout?.children.length).toBe(1);
      expect(layout?.children[0].id).toBe('other-stack');
    }
  });
});
