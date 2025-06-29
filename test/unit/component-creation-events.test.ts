import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/components/tx-layout';
import '@/components/tx-pane';
import '@/components/tx-column';
import '@/components/tx-component-container';

describe('component creation events', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('emits events for each component created', async () => {
    const componentCreatedHandler = vi.fn();

    // Create component separately to add listener before connecting
    const component = document.createElement('tx-component-container');
    component.setAttribute('title', 'Test Component');
    component.innerHTML = '<span>that worked</span>';
    component.addEventListener('component-created', componentCreatedHandler);

    container.innerHTML = `
      <tx-layout>
        <tx-column>
          <tx-pane id="target-stack">
          </tx-pane>
        </tx-column>
      </tx-layout>
    `;

    // Add component to DOM
    const stack = container.querySelector('#target-stack');
    stack?.appendChild(component);

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify component was created and event was emitted
    expect(componentCreatedHandler).toHaveBeenCalledTimes(1);
    expect(componentCreatedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          title: 'Test Component',
        }),
      }),
    );

    // Verify all components exist
    const layout = container.querySelector('tx-layout');
    const column = container.querySelector('tx-column');

    expect(layout).toBeTruthy();
    expect(column).toBeTruthy();
    expect(stack).toBeTruthy();
    expect(component).toBeTruthy();

    // Verify content
    const span = component?.querySelector('span');
    expect(span?.textContent).toBe('that worked');
  });

  it('emits component-destroyed event on removal', async () => {
    const componentDestroyedHandler = vi.fn();

    container.innerHTML = `
      
        <span>content</span>
      
    `;

    const component = container.querySelector('tx-component-container');
    component?.addEventListener('component-destroyed', componentDestroyedHandler);

    // Wait for component to initialize
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Remove component
    component?.remove();

    expect(componentDestroyedHandler).toHaveBeenCalledTimes(1);
  });
});
