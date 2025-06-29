import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';

describe('empty stack', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders empty stack correctly', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          
            <div>Component 1</div>
          
          
            <div>Component 2</div>
          
          <tx-pane>
            <!-- Empty stack -->
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('tx-row');
    expect(row).toBeTruthy();
    expect(row?.children.length).toBe(3);

    const stack = container.querySelector('tx-pane');
    expect(stack).toBeTruthy();

    // Check that stack has no content children (only tabs in slot)
    const contentChildren = Array.from(stack?.children || []).filter(
      (child) => !child.hasAttribute('slot'),
    );
    expect(contentChildren.length).toBe(0);
  });

  it('can add component to empty stack', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="empty-stack">
            <!-- Empty stack -->
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('#empty-stack');
    expect(stack).toBeTruthy();

    // Add a component to the empty stack
    const newComponent = document.createElement('tx-component-container');
    newComponent.setAttribute('title', 'New Component');
    newComponent.innerHTML = '<div>New Content</div>';

    stack?.appendChild(newComponent);

    // Wait for mutation observer to update tabs
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify component was added
    const components = stack?.querySelectorAll('tx-component-container');
    expect(components?.length).toBe(1);

    // Verify tab was created
    const tabs = stack?.querySelectorAll('tx-tab');
    expect(tabs?.length).toBe(1);
    expect(tabs?.[0].getAttribute('title')).toBe('New Component');
  });

  it('handles multiple components added to empty stack', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane id="empty-stack">
          <!-- Empty stack -->
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('#empty-stack');

    // Add multiple components
    for (let i = 1; i <= 3; i++) {
      const component = document.createElement('tx-component-container');
      component.setAttribute('title', `Component ${i}`);
      component.innerHTML = `<div>Content ${i}</div>`;
      stack?.appendChild(component);
    }

    // Wait for updates
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify all components were added
    const components = stack?.querySelectorAll('tx-component-container');
    expect(components?.length).toBe(3);

    // Verify all tabs were created
    const tabs = stack?.querySelectorAll('tx-tab');
    expect(tabs?.length).toBe(3);

    // Verify first tab is active
    expect(tabs?.[0].hasAttribute('active')).toBe(true);
    expect(tabs?.[1].hasAttribute('active')).toBe(false);
    expect(tabs?.[2].hasAttribute('active')).toBe(false);

    // Verify first component is visible
    expect(components?.[0].classList.contains('active')).toBe(true);
  });

  it('removes empty stack when all components are removed', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div>Content 1</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('tx-layout');
    const _stack = container.querySelector('tx-pane');
    const tab = container.querySelector('tx-tab');

    // Close the tab
    const closeButton = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeButton?.click();

    // Wait for updates
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stack should be removed due to auto-cleanup
    expect(container.querySelector('tx-pane')).toBeNull();

    // Layout should be empty
    expect(layout?.children.length).toBe(0);
  });
});
