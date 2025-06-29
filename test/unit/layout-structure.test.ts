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
      <tx-layout>
        <tx-pane>
          
            <div>Content</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const stack = container.querySelector('tx-pane');
    const component = container.querySelector('tx-component-container');

    // Verify the structure
    expect(component?.parentElement).toBe(stack);
    expect(stack?.parentElement).toBe(layout);

    // Verify a tab was created
    const tab = stack?.querySelector('tx-tab');
    expect(tab).toBeTruthy();
    expect(tab?.getAttribute('title')).toBe('Standalone Component');
  });

  it('maintains proper DOM hierarchy', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-pane>
              
                <div>Content 1</div>
              
            </tx-pane>
          </tx-column>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify structure
    const layout = container.querySelector('tx-layout');
    const row = container.querySelector('tx-row');
    const column = container.querySelector('tx-column');
    const stacks = container.querySelectorAll('tx-pane');
    const components = container.querySelectorAll('tx-component-container');

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
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-row>
              <tx-pane>
                
                  <div>Content 1</div>
                
              </tx-pane>
              <tx-pane>
                
                  <div>Content 2</div>
                
              </tx-pane>
            </tx-row>
          </tx-column>
          <tx-pane>
            
              <div>Content 3</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const outerRow = container.querySelector('tx-row');
    const column = container.querySelector('tx-column');
    const innerRow = column?.querySelector('tx-row');
    const stacks = container.querySelectorAll('tx-pane');

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
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
          
            <div>Content 2</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const stack = container.querySelector('tx-pane');
    const components = container.querySelectorAll('tx-component-container');
    const tabs = container.querySelectorAll('tx-tab');

    expect(stack?.parentElement).toBe(layout);
    expect(components.length).toBe(2);
    expect(tabs.length).toBe(2);
  });

  it('handles splitters between layout items', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane>
            
              <div>Left content</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane>
            
              <div>Right content</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('tx-row');
    const splitter = container.querySelector('tx-splitter');
    const stacks = container.querySelectorAll('tx-pane');

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
