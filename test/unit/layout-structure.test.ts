import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';

describe('layout structure', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('components should be placed in stacks', async () => {
    // In our Web Components version, components must be explicitly placed in stacks
    container.innerHTML = `
      <gl-layout>
        <gl-pane>
          
            <div>Content</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const stack = container.querySelector('gl-pane');
    const component = container.querySelector('gl-component-container');

    // Verify the structure
    expect(component?.parentElement).toBe(stack);
    expect(stack?.parentElement).toBe(layout);

    // Verify a tab was created
    const tab = stack?.querySelector('gl-tab');
    expect(tab).toBeTruthy();
    expect(tab?.getAttribute('title')).toBe('Standalone Component');
  });

  it('maintains proper DOM hierarchy', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-pane>
              
                <div>Content 1</div>
              
            </gl-pane>
          </gl-column>
          <gl-pane>
            
              <div>Content 2</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify structure
    const layout = container.querySelector('gl-layout');
    const row = container.querySelector('gl-row');
    const column = container.querySelector('gl-column');
    const stacks = container.querySelectorAll('gl-pane');
    const components = container.querySelectorAll('gl-component-container');

    expect(layout).toBeTruthy();
    expect(row?.parentElement).toBe(layout);
    expect(column?.parentElement).toBe(row);
    expect(stacks.length).toBe(2);
    expect(stacks[0].parentElement).toBe(column);
    expect(stacks[1].parentElement).toBe(row);
    expect(components.length).toBe(2);
  });

  it('handles nested rows and columns', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-row>
              <gl-pane>
                
                  <div>Content 1</div>
                
              </gl-pane>
              <gl-pane>
                
                  <div>Content 2</div>
                
              </gl-pane>
            </gl-row>
          </gl-column>
          <gl-pane>
            
              <div>Content 3</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const outerRow = container.querySelector('gl-row');
    const column = container.querySelector('gl-column');
    const innerRow = column?.querySelector('gl-row');
    const stacks = container.querySelectorAll('gl-pane');

    expect(outerRow).toBeTruthy();
    expect(column).toBeTruthy();
    expect(innerRow).toBeTruthy();
    expect(stacks.length).toBe(3);

    // Verify proper nesting
    expect(innerRow?.parentElement).toBe(column);
    expect(column?.parentElement).toBe(outerRow);
  });

  it('single stack at root level', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-pane>
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </gl-pane>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const stack = container.querySelector('gl-pane');
    const components = container.querySelectorAll('gl-component-container');
    const tabs = container.querySelectorAll('gl-tab');

    expect(stack?.parentElement).toBe(layout);
    expect(components.length).toBe(2);
    expect(tabs.length).toBe(2);
  });

  it('handles splitters between layout items', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-pane>
            
              <div>Left content</div>
            
          </gl-pane>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-pane>
            
              <div>Right content</div>
            
          </gl-pane>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('gl-row');
    const splitter = container.querySelector('gl-splitter');
    const stacks = container.querySelectorAll('gl-pane');

    expect(splitter).toBeTruthy();
    expect(splitter?.getAttribute('orientation')).toBe('horizontal');
    expect(splitter?.parentElement).toBe(row);

    // Splitter should be between the two stacks
    const children = Array.from(row?.children || []);
    expect(children[0]).toBe(stacks[0]);
    expect(children[1]).toBe(splitter);
    expect(children[2]).toBe(stacks[1]);
  });
});
