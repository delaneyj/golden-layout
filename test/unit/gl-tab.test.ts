import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/components/gl-tab';

describe('gl-tab', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should render with title', () => {
    container.innerHTML = '<gl-tab title="Test Tab"></gl-tab>';
    const tab = container.querySelector('gl-tab');

    expect(tab).toBeTruthy();
    expect(tab?.shadowRoot?.textContent).toContain('Test Tab');
  });

  it('should toggle active state', () => {
    container.innerHTML = '<gl-tab title="Test Tab"></gl-tab>';
    const tab = container.querySelector('gl-tab');

    expect(tab?.hasAttribute('active')).toBe(false);

    tab?.setAttribute('active', '');
    expect(tab?.hasAttribute('active')).toBe(true);

    tab?.removeAttribute('active');
    expect(tab?.hasAttribute('active')).toBe(false);
  });

  it('should show close button when closable', () => {
    container.innerHTML = '<gl-tab title="Test Tab" closable="true"></gl-tab>';
    const tab = container.querySelector('gl-tab');

    const closeButton = tab?.shadowRoot?.querySelector('.close');
    expect(closeButton).toBeTruthy();
  });

  it('should hide close button when not closable', () => {
    container.innerHTML = '<gl-tab title="Test Tab" closable="false"></gl-tab>';
    const tab = container.querySelector('gl-tab');

    const closeButton = tab?.shadowRoot?.querySelector('.close');
    expect(closeButton).toBeFalsy();
  });

  it('should emit tab-clicked event', () => {
    container.innerHTML = '<gl-tab title="Test Tab"></gl-tab>';
    const tab = container.querySelector('gl-tab');
    const clickHandler = vi.fn();

    tab?.addEventListener('tab-clicked', clickHandler);
    tab?.click();

    expect(clickHandler).toHaveBeenCalled();
  });

  it('should emit tab-close-requested event', () => {
    container.innerHTML = '<gl-tab title="Test Tab" closable="true"></gl-tab>';
    const tab = container.querySelector('gl-tab');
    const closeHandler = vi.fn();

    tab?.addEventListener('tab-close-requested', closeHandler);

    const closeButton = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeButton?.click();

    expect(closeHandler).toHaveBeenCalled();
  });

  it('should be draggable', () => {
    container.innerHTML = '<gl-tab title="Test Tab"></gl-tab>';
    const tab = container.querySelector('gl-tab');

    expect(tab?.getAttribute('draggable')).toBe('true');
  });
});
