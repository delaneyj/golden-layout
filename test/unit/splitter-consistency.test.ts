import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';
import type { TilexSplitter } from '@/components/tx-splitter';
import type { TilexRowElement } from '@/types/elements';

describe('splitter consistency', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Set CSS custom properties that would normally come from tilex.css
    document.documentElement.style.setProperty('--tx-splitter-size', '5px');

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
      <tx-layout>
        <tx-row>
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const splitter = container.querySelector('tx-splitter') as TilexSplitter;

    // Check splitter exists and has correct orientation
    expect(splitter).toBeTruthy();
    expect(splitter.orientation).toBe('horizontal');

    // Check shadow DOM styles are applied
    const shadowStyles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(shadowStyles).toContain('width: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('min-width: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('max-width: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('flex-shrink: 0');
    expect(shadowStyles).toContain('height: 100%');
  });

  it('maintains splitter height in vertical orientation', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-column>
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="vertical"></tx-splitter>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-column>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const splitter = container.querySelector('tx-splitter') as TilexSplitter;

    // Check splitter exists and has correct orientation
    expect(splitter).toBeTruthy();
    expect(splitter.orientation).toBe('vertical');

    // Check shadow DOM styles are applied
    const shadowStyles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(shadowStyles).toContain('height: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('min-height: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('max-height: var(--tx-splitter-size, 5px)');
    expect(shadowStyles).toContain('flex-shrink: 0');
    expect(shadowStyles).toContain('width: 100%');
  });

  it('preserves splitter styles after container removal', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-pane>
              
                <div>Content 1</div>
              
            </tx-pane>
            <tx-splitter orientation="vertical"></tx-splitter>
            <tx-pane id="remove-me">
              
                <div>Content 2</div>
              
            </tx-pane>
          </tx-column>
          <tx-splitter orientation="horizontal" id="main-splitter"></tx-splitter>
          <tx-pane>
            
              <div>Content 3</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const mainSplitter = container.querySelector('#main-splitter') as TilexSplitter;

    // Check initial splitter has correct styles
    const initialStyles = mainSplitter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(initialStyles).toContain('width: var(--tx-splitter-size, 5px)');

    // Remove a stack which will trigger restructuring
    const stackToRemove = container.querySelector('#remove-me');
    const tab = stackToRemove?.querySelector('tx-tab');
    const closeBtn = tab?.shadowRoot?.querySelector('.close') as HTMLElement;
    closeBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Main splitter should still exist and have correct styles
    const splitterAfter = container.querySelector('#main-splitter') as TilexSplitter;
    expect(splitterAfter).toBeTruthy();
    const finalStyles = splitterAfter.shadowRoot?.querySelector('style')?.textContent || '';
    expect(finalStyles).toContain('width: var(--tx-splitter-size, 5px)');
  });

  it('maintains consistent splitter styles in complex layouts', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-column>
            <tx-pane>
              
                <div>Content 1</div>
              
            </tx-pane>
            <tx-splitter orientation="vertical" class="v-splitter"></tx-splitter>
            <tx-pane>
              
                <div>Content 2</div>
              
            </tx-pane>
          </tx-column>
          <tx-splitter orientation="horizontal" class="h-splitter"></tx-splitter>
          <tx-column>
            <tx-pane>
              
                <div>Content 3</div>
              
            </tx-pane>
            <tx-splitter orientation="vertical" class="v-splitter"></tx-splitter>
            <tx-pane>
              
                <div>Content 4</div>
              
            </tx-pane>
          </tx-column>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check all splitters
    const hSplitters = container.querySelectorAll('.h-splitter') as NodeListOf<TilexSplitter>;
    const vSplitters = container.querySelectorAll('.v-splitter') as NodeListOf<TilexSplitter>;

    hSplitters.forEach((splitter) => {
      expect(splitter.orientation).toBe('horizontal');
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('width: var(--tx-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });

    vSplitters.forEach((splitter) => {
      expect(splitter.orientation).toBe('vertical');
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('height: var(--tx-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });
  });

  it('excludes splitters from flexible child calculations', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row id="test-row">
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
          <tx-splitter orientation="horizontal"></tx-splitter>
          <tx-pane>
            
              <div>Content 3</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const row = container.querySelector('#test-row') as TilexRowElement;
    const stacks = container.querySelectorAll('tx-pane');
    const splitters = container.querySelectorAll('tx-splitter') as NodeListOf<TilexSplitter>;

    // Should have 3 stacks and 2 splitters
    expect(stacks.length).toBe(3);
    expect(splitters.length).toBe(2);

    // Each splitter should have fixed size styles
    splitters.forEach((splitter) => {
      const styles = splitter.shadowRoot?.querySelector('style')?.textContent || '';
      expect(styles).toContain('width: var(--tx-splitter-size, 5px)');
      expect(styles).toContain('flex-shrink: 0');
    });

    // Check row has correct styles for splitters
    const rowShadowRoot = row.shadowRoot;
    const rowStyles = rowShadowRoot?.querySelector('style')?.textContent || '';
    expect(rowStyles).toContain('::slotted(tx-splitter)');
    expect(rowStyles).toContain('flex: 0 0 var(--tx-splitter-size, 5px)');
  });
});
