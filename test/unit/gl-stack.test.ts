import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/components/gl-stack';
import '@/components/gl-component-container';

describe('gl-stack', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should render with header and content', () => {
    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Component 1">
          <div>Content 1</div>
        </gl-component-container>
      </gl-stack>
    `;

    const stack = container.querySelector('gl-stack');
    expect(stack).toBeTruthy();

    const header = stack?.shadowRoot?.querySelector('gl-header');
    expect(header).toBeTruthy();
  });

  it('should create tabs from content children', async () => {
    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Component 1">
          <div>Content 1</div>
        </gl-component-container>
        <gl-component-container title="Component 2">
          <div>Content 2</div>
        </gl-component-container>
      </gl-stack>
    `;

    const stack = container.querySelector('gl-stack');

    // Wait for mutation observer to process and components to initialize
    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = stack?.querySelectorAll('gl-tab');
    expect(tabs?.length).toBe(2);
    expect(tabs?.[0].getAttribute('title')).toBe('Component 1');
    expect(tabs?.[1].getAttribute('title')).toBe('Component 2');
  });

  it('should switch active tab on click', async () => {
    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Component 1">
          <div>Content 1</div>
        </gl-component-container>
        <gl-component-container title="Component 2">
          <div>Content 2</div>
        </gl-component-container>
      </gl-stack>
    `;

    const stack = container.querySelector('gl-stack');

    // Wait for mutation observer to process and components to initialize
    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = stack?.querySelectorAll('gl-tab');
    const tabChangeHandler = vi.fn();

    stack?.addEventListener('tab-changed', tabChangeHandler);

    // Click second tab
    tabs?.[1].dispatchEvent(new Event('tab-clicked', { bubbles: true }));

    expect(tabChangeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { index: 1 },
      }),
    );
    expect(stack?.getAttribute('active-index')).toBe('1');
  });

  it('should handle tab close', async () => {
    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Component 1">
          <div>Content 1</div>
        </gl-component-container>
        <gl-component-container title="Component 2">
          <div>Content 2</div>
        </gl-component-container>
      </gl-stack>
    `;

    const stack = container.querySelector('gl-stack');

    // Wait for mutation observer to process and components to initialize
    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = stack?.querySelectorAll('gl-tab');
    const tabCloseHandler = vi.fn();

    stack?.addEventListener('tab-close', tabCloseHandler);

    // Close first tab
    tabs?.[0].dispatchEvent(new Event('tab-close-requested', { bubbles: true }));

    expect(tabCloseHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { index: 0 },
      }),
    );

    // Wait for DOM updates
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should have only one tab left
    const remainingTabs = stack?.querySelectorAll('gl-tab');
    expect(remainingTabs?.length).toBe(1);
  });

  it('should toggle maximize state', () => {
    container.innerHTML = `
      <gl-stack>
        <gl-component-container title="Component 1">
          <div>Content 1</div>
        </gl-component-container>
      </gl-stack>
    `;

    const stack = container.querySelector('gl-stack');
    const maximizeHandler = vi.fn();

    stack?.addEventListener('maximize-changed', maximizeHandler);

    // Simulate maximize button click instead of dispatching event on header
    const maximizeBtn = stack?.shadowRoot?.querySelector('gl-header')?.shadowRoot?.querySelector('.maximize') as HTMLElement;
    maximizeBtn?.click();

    expect(stack?.hasAttribute('maximized')).toBe(true);
    expect(maximizeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { isMaximized: true },
      }),
    );
  });
});
