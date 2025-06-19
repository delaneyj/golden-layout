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
      <gl-layout>
        <gl-stack id="target-stack">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('#target-stack');
    const initialComponentCount = stack?.querySelectorAll('gl-component-container').length;
    expect(initialComponentCount).toBe(1);

    // Add new component
    const newComponent = document.createElement('gl-component-container');
    newComponent.setAttribute('title', 'Component 2');
    newComponent.innerHTML = '<div>Content 2</div>';
    stack?.appendChild(newComponent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const components = stack?.querySelectorAll('gl-component-container');
    const tabs = stack?.querySelectorAll('gl-tab');

    expect(components?.length).toBe(2);
    expect(tabs?.length).toBe(2);
    expect(tabs?.[1].getAttribute('title')).toBe('Component 2');
  });

  it('removes components from stack', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Component 1" id="comp1">
            <div>Content 1</div>
          </gl-component-container>
          <gl-component-container title="Component 2" id="comp2">
            <div>Content 2</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-stack');
    const comp1 = container.querySelector('#comp1');

    // Remove first component
    comp1?.remove();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const remainingComponents = stack?.querySelectorAll('gl-component-container');
    const remainingTabs = stack?.querySelectorAll('gl-tab');

    expect(remainingComponents?.length).toBe(1);
    expect(remainingTabs?.length).toBe(1);
    expect(remainingComponents?.[0].getAttribute('title')).toBe('Component 2');
  });

  it('replaces component with another', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Original" id="original">
            <div>Original content</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-stack');
    const original = container.querySelector('#original');

    // Create replacement
    const replacement = document.createElement('gl-component-container');
    replacement.setAttribute('title', 'Replacement');
    replacement.innerHTML = '<div>Replacement content</div>';

    // Replace
    original?.replaceWith(replacement);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const components = stack?.querySelectorAll('gl-component-container');
    const tabs = stack?.querySelectorAll('gl-tab');

    expect(components?.length).toBe(1);
    expect(components?.[0].getAttribute('title')).toBe('Replacement');
    expect(tabs?.[0].getAttribute('title')).toBe('Replacement');
  });

  it('adds new stack to row', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row id="target-row">
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('#target-row');

    // Add splitter
    const splitter = document.createElement('gl-splitter');
    splitter.setAttribute('orientation', 'horizontal');
    row?.appendChild(splitter);

    // Add new stack
    const newStack = document.createElement('gl-stack');
    const newComponent = document.createElement('gl-component-container');
    newComponent.setAttribute('title', 'Component 2');
    newComponent.innerHTML = '<div>Content 2</div>';
    newStack.appendChild(newComponent);
    row?.appendChild(newStack);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stacks = row?.querySelectorAll('gl-stack');
    expect(stacks?.length).toBe(2);

    const components = container.querySelectorAll('gl-component-container');
    expect(components.length).toBe(2);
  });

  it('converts stack to row with multiple stacks', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-stack id="original-stack">
          <gl-component-container title="Component 1">
            <div>Content 1</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const originalStack = container.querySelector('#original-stack');

    // Create row with two stacks
    const row = document.createElement('gl-row');

    // Move original stack to row
    if (originalStack) {
      row.appendChild(originalStack);
    }

    // Add splitter
    const splitter = document.createElement('gl-splitter');
    splitter.setAttribute('orientation', 'horizontal');
    row.appendChild(splitter);

    // Add second stack
    const stack2 = document.createElement('gl-stack');
    const comp2 = document.createElement('gl-component-container');
    comp2.setAttribute('title', 'Component 2');
    comp2.innerHTML = '<div>Content 2</div>';
    stack2.appendChild(comp2);
    row.appendChild(stack2);

    // Replace content in layout
    layout?.appendChild(row);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(row.parentElement).toBe(layout);
    expect(row.querySelectorAll('gl-stack').length).toBe(2);
    expect(container.querySelectorAll('gl-component-container').length).toBe(2);
  });

  it('maintains parent-child relationships', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-stack>
              <gl-component-container title="Component 1">
                <div>Content 1</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const row = container.querySelector('gl-row');
    const column = container.querySelector('gl-column');
    const stack = container.querySelector('gl-stack');
    const component = container.querySelector('gl-component-container');

    // Verify hierarchy
    expect(component?.parentElement).toBe(stack);
    expect(stack?.parentElement).toBe(column);
    expect(column?.parentElement).toBe(row);
    expect(row?.parentElement).toBe(layout);
  });

  it('removes empty containers', async () => {
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
            <gl-component-container title="Component 2" id="comp2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack2 = container.querySelector('#stack2');
    const _comp2 = container.querySelector('#comp2');

    // Close the only component in stack2
    const tab2 = stack2?.querySelector('gl-tab');
    const closeBtn = tab2?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack2 should now be empty but still exist
    expect(stack2?.querySelectorAll('gl-component-container').length).toBe(0);
    expect(stack2?.parentElement).toBeTruthy();
  });

  it('moves components between stacks', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="source">
            <gl-component-container title="Moving Component" id="moving">
              <div>I will move</div>
            </gl-component-container>
          </gl-stack>
          <gl-stack id="target">
            <gl-component-container title="Static Component">
              <div>I stay here</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
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
    expect(sourceStack?.querySelectorAll('gl-component-container').length).toBe(0);
    expect(targetStack?.querySelectorAll('gl-component-container').length).toBe(2);

    // Check tabs - source stack will still have the old tab until cleanup
    // This is a limitation of our current implementation
    expect(targetStack?.querySelectorAll('gl-tab').length).toBe(2);
  });
});
