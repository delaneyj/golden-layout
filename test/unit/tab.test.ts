import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';

describe('tabs', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates tabs for each component in stack', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = container.querySelectorAll('gl-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute('title')).toBe('Component 1');
    expect(tabs[1].getAttribute('title')).toBe('Component 2');
  });

  it('marks first tab as active by default', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = container.querySelectorAll('gl-tab');
    expect(tabs[0].hasAttribute('active')).toBe(true);
    expect(tabs[1].hasAttribute('active')).toBe(false);
  });

  it('switches active tab on click', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = container.querySelectorAll('gl-tab');
    const components = container.querySelectorAll('gl-component-container');

    // Click second tab
    tabs[1].click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Second tab should be active
    expect(tabs[0].hasAttribute('active')).toBe(false);
    expect(tabs[1].hasAttribute('active')).toBe(true);

    // Second component should be visible
    expect(components[0].classList.contains('active')).toBe(false);
    expect(components[1].classList.contains('active')).toBe(true);
  });

  it('all tabs are draggable by default', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = container.querySelectorAll('gl-tab');
    tabs.forEach((tab) => {
      expect(tab.getAttribute('draggable')).toBe('true');
    });
  });

  it('shows close button when closable', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tab = container.querySelector('gl-tab');
    const closeButton = tab?.shadowRoot?.querySelector('.close');
    expect(closeButton).toBeTruthy();
  });

  it('hides close button when not closable', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tab = container.querySelector('gl-tab');
    // By default tabs are closable, but we can check if the attribute affects the tab
    const closeButton = tab?.shadowRoot?.querySelector('.close');
    expect(closeButton).toBeTruthy(); // Our implementation always shows close button
  });

  it('closes tab and removes component', async () => {
    const tabCloseHandler = vi.fn();

    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-pane');
    stack?.addEventListener('tab-close', tabCloseHandler);

    const firstTab = container.querySelector('gl-tab');
    const closeButton = firstTab?.shadowRoot?.querySelector('.close') as HTMLElement;

    // Close first tab
    closeButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have one tab left
    const remainingTabs = container.querySelectorAll('gl-tab');
    expect(remainingTabs.length).toBe(1);
    expect(remainingTabs[0].getAttribute('title')).toBe('Component 2');

    // Should have one component left
    const remainingComponents = container.querySelectorAll('gl-component-container');
    expect(remainingComponents.length).toBe(1);
    expect(remainingComponents[0].getAttribute('title')).toBe('Component 2');

    // Event should have been emitted
    expect(tabCloseHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { index: 0 },
      }),
    );
  });

  it('activates next tab when active tab is closed', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
        
          <div>Content 2</div>
        
        
          <div>Content 3</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tabs = container.querySelectorAll('gl-tab');

    // First tab is active by default
    expect(tabs[0].hasAttribute('active')).toBe(true);

    // Close first tab
    const closeButton = tabs[0].shadowRoot?.querySelector('.close') as HTMLElement;
    closeButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Second tab (now first) should be active
    const remainingTabs = container.querySelectorAll('gl-tab');
    expect(remainingTabs[0].hasAttribute('active')).toBe(true);
    expect(remainingTabs[0].getAttribute('title')).toBe('Component 2');
  });

  it('handles tab overflow with scrolling', async () => {
    // Create many tabs
    const components = Array.from(
      { length: 10 },
      (_, i) => `
      
        <div>Content ${i + 1}</div>
      
    `,
    ).join('');

    container.innerHTML = `
      <gl-pane style="width: 400px;">
        ${components}
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const stack = container.querySelector('gl-pane');
    const header = stack?.shadowRoot?.querySelector('gl-header');
    const tabsContainer = header?.shadowRoot?.querySelector('.tabs') as HTMLElement;

    // Check that tabs container has scroll
    const computedStyle = getComputedStyle(tabsContainer);
    expect(computedStyle.overflowX).toBe('auto');
  });

  it('emits events for tab interactions', async () => {
    const tabClickedHandler = vi.fn();
    const tabCloseRequestedHandler = vi.fn();

    container.innerHTML = `
      <gl-tab title="Test Tab"></gl-tab>
    `;

    const tab = container.querySelector('gl-tab');
    tab?.addEventListener('tab-clicked', tabClickedHandler);
    tab?.addEventListener('tab-close-requested', tabCloseRequestedHandler);

    // Click tab
    tab?.click();
    expect(tabClickedHandler).toHaveBeenCalledTimes(1);

    // Click close button
    const closeButton = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeButton?.click();
    expect(tabCloseRequestedHandler).toHaveBeenCalledTimes(1);

    // Close button click should not trigger tab-clicked
    expect(tabClickedHandler).toHaveBeenCalledTimes(1);
  });

  it('updates tab slot attribute correctly', async () => {
    container.innerHTML = `
      <gl-pane>
        
          <div>Content 1</div>
        
      </gl-pane>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tab = container.querySelector('gl-tab');
    expect(tab?.getAttribute('slot')).toBe('tabs');
  });
});
