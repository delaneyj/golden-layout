import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';

describe('tree manipulation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('adds components to existing stack', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane id="target-stack">
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('#target-stack');
    const initialComponentCount = stack?.querySelectorAll('tx-component-container').length;
    expect(initialComponentCount).toBe(1);

    // Add new component
    const newComponent = document.createElement('tx-component-container');
    newComponent.setAttribute('title', 'Component 2');
    newComponent.innerHTML = '<div>Content 2</div>';
    stack?.appendChild(newComponent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const components = stack?.querySelectorAll('tx-component-container');
    const tabs = stack?.querySelectorAll('tx-tab');

    expect(components?.length).toBe(2);
    expect(tabs?.length).toBe(2);
    expect(tabs?.[1].getAttribute('title')).toBe('Component 2');
  });

  it('removes components from stack', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('tx-pane');
    const comp1 = container.querySelector('#comp1');

    // Remove first component
    comp1?.remove();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const remainingComponents = stack?.querySelectorAll('tx-component-container');
    const remainingTabs = stack?.querySelectorAll('tx-tab');

    expect(remainingComponents?.length).toBe(1);
    expect(remainingTabs?.length).toBe(1);
    expect(remainingComponents?.[0].getAttribute('title')).toBe('Component 2');
  });

  it('replaces component with another', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Original content</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('tx-pane');
    const original = container.querySelector('#original');

    // Create replacement
    const replacement = document.createElement('tx-component-container');
    replacement.setAttribute('title', 'Replacement');
    replacement.innerHTML = '<div>Replacement content</div>';

    // Replace
    original?.replaceWith(replacement);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const components = stack?.querySelectorAll('tx-component-container');
    const tabs = stack?.querySelectorAll('tx-tab');

    expect(components?.length).toBe(1);
    expect(components?.[0].getAttribute('title')).toBe('Replacement');
    expect(tabs?.[0].getAttribute('title')).toBe('Replacement');
  });

  it('adds new stack to row', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row id="target-row">
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('#target-row');

    // Add splitter
    const splitter = document.createElement('tx-splitter');
    splitter.setAttribute('orientation', 'horizontal');
    row?.appendChild(splitter);

    // Add new stack
    const newStack = document.createElement('tx-pane');
    const newComponent = document.createElement('tx-component-container');
    newComponent.setAttribute('title', 'Component 2');
    newComponent.innerHTML = '<div>Content 2</div>';
    newStack.appendChild(newComponent);
    row?.appendChild(newStack);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stacks = row?.querySelectorAll('tx-pane');
    expect(stacks?.length).toBe(2);

    const components = container.querySelectorAll('tx-component-container');
    expect(components.length).toBe(2);
  });

  it('converts stack to row with multiple stacks', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane id="original-stack">
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const originalStack = container.querySelector('#original-stack');

    // Create row with two stacks
    const row = document.createElement('tx-row');

    // Move original stack to row
    if (originalStack) {
      row.appendChild(originalStack);
    }

    // Add splitter
    const splitter = document.createElement('tx-splitter');
    splitter.setAttribute('orientation', 'horizontal');
    row.appendChild(splitter);

    // Add second stack
    const stack2 = document.createElement('tx-pane');
    const comp2 = document.createElement('tx-component-container');
    comp2.setAttribute('title', 'Component 2');
    comp2.innerHTML = '<div>Content 2</div>';
    stack2.appendChild(comp2);
    row.appendChild(stack2);

    // Replace content in layout
    layout?.appendChild(row);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(row.parentElement).toBe(layout);
    expect(row.querySelectorAll('tx-pane').length).toBe(2);
    expect(container.querySelectorAll('tx-component-container').length).toBe(2);
  });

  it('maintains parent-child relationships', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-pane>
              
                <div>Content 1</div>
              
            </tx-pane>
          </tx-column>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const row = container.querySelector('tx-row');
    const column = container.querySelector('tx-column');
    const stack = container.querySelector('tx-pane');
    const component = container.querySelector('tx-component-container');

    // Verify hierarchy
    expect(component?.parentElement).toBe(stack);
    expect(stack?.parentElement).toBe(column);
    expect(column?.parentElement).toBe(row);
    expect(row?.parentElement).toBe(layout);
  });

  it('removes empty containers', async () => {
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

    const stack2 = container.querySelector('#stack2');
    const _comp2 = container.querySelector('#comp2');

    // Close the only component in stack2
    const tab2 = stack2?.querySelector('tx-tab');
    const closeBtn = tab2?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack2 should be removed due to auto-cleanup
    expect(container.querySelector('#stack2')).toBeNull();

    // Splitter should also be removed
    expect(container.querySelectorAll('tx-splitter').length).toBe(0);

    // Only stack1 should remain
    const layout = container.querySelector('tx-layout');
    expect(layout?.children.length).toBe(1);
    expect(layout?.children[0].id).toBe('stack1');
  });

  it('moves components between stacks', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="source">
            
              <div>I will move</div>
            
          </tx-pane>
          <tx-pane id="target">
            
              <div>I stay here</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const sourceStack = container.querySelector('#source');
    const targetStack = container.querySelector('#target');
    const movingComponent = container.querySelector('#moving');

    // Move component
    if (movingComponent) {
      targetStack?.appendChild(movingComponent);
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify move
    expect(movingComponent?.parentElement).toBe(targetStack);
    expect(sourceStack?.querySelectorAll('tx-component-container').length).toBe(0);
    expect(targetStack?.querySelectorAll('tx-component-container').length).toBe(2);

    // Check tabs - source stack will still have the old tab until cleanup
    // This is a limitation of our current implementation
    expect(targetStack?.querySelectorAll('tx-tab').length).toBe(2);
  });
});
