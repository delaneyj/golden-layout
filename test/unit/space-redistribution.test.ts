import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { TilexLayoutElement, TilexPaneElement } from '@/types/elements';

describe('space redistribution', () => {
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

  it('redistributes space when a stack is removed from a row', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="stack1" data-width="30%">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="stack2" data-width="40%">
            
              <div>Content 2</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="stack3" data-width="30%">
            
              <div>Content 3</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('tx-row');
    const stack2 = container.querySelector('#stack2');
    const tab2 = stack2?.querySelector('tx-tab');

    // Check initial sizes
    const stack1Before = container.querySelector('#stack1') as HTMLElement;
    const stack3Before = container.querySelector('#stack3') as HTMLElement;

    expect(stack1Before.getAttribute('data-width')).toBe('30%');
    expect(stack3Before.getAttribute('data-width')).toBe('30%');

    // Close the middle stack
    const closeBtn = tab2?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack2 should be removed
    expect(container.querySelector('#stack2')).toBeNull();

    // Remaining stacks should have their data-width attributes removed
    const stack1After = container.querySelector('#stack1') as HTMLElement;
    const stack3After = container.querySelector('#stack3') as HTMLElement;

    expect(stack1After.getAttribute('data-width')).toBeNull();
    expect(stack3After.getAttribute('data-width')).toBeNull();

    // There should be only one splitter left
    expect(row?.querySelectorAll('tx-splitter').length).toBe(1);
  });

  it('redistributes space when a stack is removed from a column', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-column>
          <tx-pane id="stack1" data-height="25%">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="vertical"></tx-splitter>
          <tx-pane id="stack2" data-height="25%">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-column>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const column = container.querySelector('tx-column');
    const stack1 = container.querySelector('#stack1');
    const tab1 = stack1?.querySelector('tx-tab');

    // Close stack1
    const closeBtn = tab1?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack1 should be removed
    expect(container.querySelector('#stack1')).toBeNull();

    // Stack2 should have its data-height attribute removed
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    expect(stack2.getAttribute('data-height')).toBeNull();

    // No splitters should remain
    expect(column?.querySelectorAll('tx-splitter').length).toBe(0);
  });

  it('redistributes space after drag and drop', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="source" data-width="50%">
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="target" data-width="50%">
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout') as TilexLayoutElement;
    const sourceStack = container.querySelector('#source') as TilexPaneElement;
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

    // Check if row still exists or was replaced
    const row = container.querySelector('tx-row');
    const layout2 = container.querySelector('tx-layout');

    if (row) {
      // Row still exists
      const remainingStack = container.querySelector('#target') as HTMLElement;
      expect(remainingStack.getAttribute('data-width')).toBeNull();
      expect(row.querySelectorAll('tx-splitter').length).toBe(0);
    } else {
      // Row was replaced by target stack
      expect(layout2?.children.length).toBe(1);
      expect(layout2?.children[0].id).toBe('target');
    }
  });

  it('handles complex nested redistribution', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column data-width="50%">
            <tx-pane id="stack1" data-height="50%">
              
                <div>Content 1</div>
              
            </tx-pane>
            <tx-splitter orientation="vertical"></tx-splitter>
            <tx-pane id="stack2" data-height="50%">
              
                <div>Content 2</div>
              
            </tx-pane>
          </tx-column>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane id="stack3" data-width="50%">
            
              <div>Content 3</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack1 = container.querySelector('#stack1');
    const tab1 = stack1?.querySelector('tx-tab');

    // Close stack1
    const closeBtn = tab1?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack1 should be removed
    expect(container.querySelector('#stack1')).toBeNull();

    // Check structure after cleanup
    const column = container.querySelector('tx-column');
    const row = container.querySelector('tx-row');
    const stack2 = container.querySelector('#stack2') as HTMLElement;

    if (column) {
      // Column still exists
      expect(stack2.getAttribute('data-height')).toBeNull();
      expect(column.getAttribute('data-width')).toBe('50%');
    } else if (row) {
      // Column was replaced by stack2, but row still exists
      expect(stack2.parentElement).toBe(row);
      // Stack2 should now be a direct child of row
      const rowChildren = Array.from(row.children).filter((c) => c.tagName !== 'TX-SPLITTER');
      expect(rowChildren.length).toBe(2); // stack2 and stack3
    }
  });
});
