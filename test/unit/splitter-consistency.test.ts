import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { GlSplitter } from '@/components/gl-splitter';

describe('splitter consistency', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Set CSS custom properties that would normally come from golden-layout.css
    document.documentElement.style.setProperty('--gl-splitter-size', '5px');
    
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.position = 'relative';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('maintains splitter width in horizontal orientation', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack>
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const splitter = container.querySelector('gl-splitter') as GlSplitter;
    
    // Check splitter exists and has correct orientation
    expect(splitter).toBeTruthy();
    expect(splitter.orientation).toBe('horizontal');
    
    // Check shadow DOM styles are applied
    const shadowStyles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(shadowStyles).toContain('width: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('min-width: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('max-width: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('flex-shrink: 0');
    expect(shadowStyles).toContain('height: 100%');
  });

  it('maintains splitter height in vertical orientation', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-column>
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="vertical"></gl-splitter>
          <gl-stack>
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-column>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const splitter = container.querySelector('gl-splitter') as GlSplitter;
    
    // Check splitter exists and has correct orientation
    expect(splitter).toBeTruthy();
    expect(splitter.orientation).toBe('vertical');
    
    // Check shadow DOM styles are applied
    const shadowStyles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(shadowStyles).toContain('height: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('min-height: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('max-height: var(--gl-splitter-size, 5px)');
    expect(shadowStyles).toContain('flex-shrink: 0');
    expect(shadowStyles).toContain('width: 100%');
  });

  it('preserves splitter styles after container removal', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-stack>
              <gl-component-container title="Component 1">
                <div>Content 1</div>
              </gl-component-container>
            </gl-stack>
            <gl-splitter orientation="vertical"></gl-splitter>
            <gl-stack id="remove-me">
              <gl-component-container title="Component 2">
                <div>Content 2</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
          <gl-splitter orientation="horizontal" id="main-splitter"></gl-splitter>
          <gl-stack>
            <gl-component-container title="Component 3">
              <div>Content 3</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const mainSplitter = container.querySelector('#main-splitter') as GlSplitter;
    
    // Check initial splitter has correct styles
    const initialStyles = mainSplitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(initialStyles).toContain('width: var(--gl-splitter-size, 5px)');

    // Remove a stack which will trigger restructuring
    const stackToRemove = container.querySelector('#remove-me');
    const tab = stackToRemove?.querySelector('gl-tab');
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Main splitter should still exist and have correct styles
    const splitterAfter = container.querySelector('#main-splitter') as GlSplitter;
    expect(splitterAfter).toBeTruthy();
    const finalStyles = splitterAfter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(finalStyles).toContain('width: var(--gl-splitter-size, 5px)');
  });

  it('maintains consistent splitter styles in complex layouts', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-column>
            <gl-stack>
              <gl-component-container title="Component 1">
                <div>Content 1</div>
              </gl-component-container>
            </gl-stack>
            <gl-splitter orientation="vertical" class="v-splitter"></gl-splitter>
            <gl-stack>
              <gl-component-container title="Component 2">
                <div>Content 2</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
          <gl-splitter orientation="horizontal" class="h-splitter"></gl-splitter>
          <gl-column>
            <gl-stack>
              <gl-component-container title="Component 3">
                <div>Content 3</div>
              </gl-component-container>
            </gl-stack>
            <gl-splitter orientation="vertical" class="v-splitter"></gl-splitter>
            <gl-stack>
              <gl-component-container title="Component 4">
                <div>Content 4</div>
              </gl-component-container>
            </gl-stack>
          </gl-column>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check all splitters
    const hSplitters = container.querySelectorAll('.h-splitter') as NodeListOf<GlSplitter>;
    const vSplitters = container.querySelectorAll('.v-splitter') as NodeListOf<GlSplitter>;

    hSplitters.forEach(splitter => {
      expect(splitter.orientation).toBe('horizontal');
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('width: var(--gl-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });

    vSplitters.forEach(splitter => {
      expect(splitter.orientation).toBe('vertical');
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('height: var(--gl-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });
  });

  it('excludes splitters from flexible child calculations', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row id="test-row">
          <gl-stack>
            <gl-component-container title="Component 1">
              <div>Content 1</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack>
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack>
            <gl-component-container title="Component 3">
              <div>Content 3</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('#test-row') as any;
    const stacks = container.querySelectorAll('gl-stack');
    const splitters = container.querySelectorAll('gl-splitter') as NodeListOf<GlSplitter>;

    // Should have 3 stacks and 2 splitters
    expect(stacks.length).toBe(3);
    expect(splitters.length).toBe(2);

    // Each splitter should have fixed size styles
    splitters.forEach(splitter => {
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('width: var(--gl-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });

    // Check row has correct styles for splitters
    const rowShadowRoot = row.shadowRoot;
    const rowStyles = rowShadowRoot?.querySelector('style')?.textContent || '';
    expect(rowStyles).toContain('::slotted(gl-splitter)');
    expect(rowStyles).toContain('flex: 0 0 var(--gl-splitter-size, 5px)');
  });
});