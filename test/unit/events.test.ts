import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';

describe('events', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('emits custom events from components', async () => {
    const tabClickedHandler = vi.fn();
    const tabCloseHandler = vi.fn();

    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Test Component">
          <div>Content</div>
        </gl-component-container>
      </gl-stack>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-stack');
    const tab = container.querySelector('gl-tab');

    // Listen for events
    stack?.addEventListener('tab-clicked', tabClickedHandler);
    stack?.addEventListener('tab-close-requested', tabCloseHandler);

    // Click tab
    (tab as HTMLElement)?.click();
    expect(tabClickedHandler).toHaveBeenCalledTimes(1);

    // Click close button
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();
    expect(tabCloseHandler).toHaveBeenCalledTimes(1);
  });

  it('events bubble through shadow DOM with composed flag', async () => {
    const maximizeHandler = vi.fn();

    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Test">
            <div>Content</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const stack = container.querySelector('gl-stack');

    // Listen at layout level
    layout?.addEventListener('maximize-changed', maximizeHandler);

    // Click maximize button in header (inside shadow DOM)
    const maximizeBtn = stack?.shadowRoot
      ?.querySelector('gl-header')
      ?.shadowRoot?.querySelector('.maximize') as HTMLElement;
    maximizeBtn?.click();

    // Event should bubble up through shadow boundaries
    expect(maximizeHandler).toHaveBeenCalledTimes(1);
    expect(maximizeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { isMaximized: true },
      }),
    );
  });

  it('removes event listeners properly', async () => {
    const handler = vi.fn();

    container.innerHTML = `
      <gl-component-container title="Test">
        <div>Content</div>
      </gl-component-container>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('gl-component-container');

    // Add listener
    component?.addEventListener('component-created', handler);

    // Remove component and re-add
    component?.remove();
    if (component) {
      container.appendChild(component);
    }

    // Handler should be called for the new creation
    expect(handler).toHaveBeenCalledTimes(1);

    // Remove listener
    component?.removeEventListener('component-created', handler);

    // Remove and re-add again
    component?.remove();
    if (component) {
      container.appendChild(component);
    }

    // Handler should not be called again
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('passes event detail correctly', async () => {
    const stateChangedHandler = vi.fn();

    container.innerHTML = `
      <gl-component-container title="Test">
        <div>Content</div>
      </gl-component-container>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('gl-component-container') as HTMLElement & {
      componentState: Record<string, unknown>;
    };
    component?.addEventListener('state-changed', stateChangedHandler);

    // Update component state
    const newState = { foo: 'bar', count: 42 };
    component.componentState = newState;

    expect(stateChangedHandler).toHaveBeenCalledTimes(1);
    expect(stateChangedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          state: newState,
        },
      }),
    );
  });

  it('handles multiple listeners for same event', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Test">
          <div>Content</div>
        </gl-component-container>
      </gl-stack>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-stack');

    // Add multiple listeners
    stack?.addEventListener('tab-changed', handler1);
    stack?.addEventListener('tab-changed', handler2);
    stack?.addEventListener('tab-changed', handler3);

    // Add another tab and switch to it
    const newComponent = document.createElement('gl-component-container');
    newComponent.setAttribute('title', 'New Tab');
    stack?.appendChild(newComponent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = stack?.querySelectorAll('gl-tab');
    (tabs?.[1] as HTMLElement)?.click();

    // All handlers should be called
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);

    // All should receive same event detail
    const expectedDetail = { index: 1 };
    expect(handler1).toHaveBeenCalledWith(expect.objectContaining({ detail: expectedDetail }));
    expect(handler2).toHaveBeenCalledWith(expect.objectContaining({ detail: expectedDetail }));
    expect(handler3).toHaveBeenCalledWith(expect.objectContaining({ detail: expectedDetail }));
  });

  it('stops event propagation when requested', async () => {
    const parentHandler = vi.fn();
    const childHandler = vi.fn((e: Event) => {
      e.stopPropagation();
    });

    container.innerHTML = `
      <gl-layout>
        <gl-stack>
          <gl-component-container title="Test">
            <div>Content</div>
          </gl-component-container>
        </gl-stack>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout');
    const stack = container.querySelector('gl-stack');

    // Listen on both elements
    layout?.addEventListener('tab-clicked', parentHandler);
    stack?.addEventListener('tab-clicked', childHandler);

    // Click tab
    const tab = container.querySelector('gl-tab') as HTMLElement;
    tab?.click();

    // Child handler should be called but not parent
    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(parentHandler).toHaveBeenCalledTimes(0);
  });
});
