import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@/index';

describe('complete self-target prevention', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('prevents all self-targeting but allows other stack targeting', async () => {
    container.innerHTML = `
      <gl-layout>
        <gl-row>
          <gl-stack id="stack1">
            <gl-component-container title="Component 1A">
              <div>Content 1A</div>
            </gl-component-container>
            <gl-component-container title="Component 1B">
              <div>Content 1B</div>
            </gl-component-container>
          </gl-stack>
          <gl-splitter orientation="horizontal"></gl-splitter>
          <gl-stack id="stack2">
            <gl-component-container title="Component 2">
              <div>Content 2</div>
            </gl-component-container>
          </gl-stack>
        </gl-row>
      </gl-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const layout = container.querySelector('gl-layout') as any;
    const stack1 = container.querySelector('#stack1') as HTMLElement;
    const stack2 = container.querySelector('#stack2') as HTMLElement;
    const tab1A = stack1.querySelector('gl-tab'); // First tab in stack1

    // Test 1: Dragging from stack1 to stack1 (self-target) - should not show drag-over
    layout._draggedElement = tab1A;
    
    const selfDragEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    stack1.dispatchEvent(selfDragEvent);
    
    expect(stack1.classList.contains('drag-over')).toBe(false);
    
    // Test 2: Dragging from stack1 to stack2 - should show drag-over
    const otherDragEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    stack2.dispatchEvent(otherDragEvent);
    
    expect(stack2.classList.contains('drag-over')).toBe(true);
    
    // Test 3: Dropping on stack1 (self-target) - should not move
    const selfDropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    stack1.dispatchEvent(selfDropEvent);
    
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    // Should still have 2 components in stack1
    const stack1Components = stack1.querySelectorAll('gl-component-container');
    expect(stack1Components.length).toBe(2);
    expect(stack1Components[0].getAttribute('title')).toBe('Component 1A');
    expect(stack1Components[1].getAttribute('title')).toBe('Component 1B');
    
    // Test 4: Dropping on stack2 - should move
    const otherDropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });
    stack2.dispatchEvent(otherDropEvent);
    
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    // Should now have 1 component in stack1 and 2 in stack2
    const stack1ComponentsAfter = stack1.querySelectorAll('gl-component-container');
    const stack2ComponentsAfter = stack2.querySelectorAll('gl-component-container');
    
    expect(stack1ComponentsAfter.length).toBe(1);
    expect(stack1ComponentsAfter[0].getAttribute('title')).toBe('Component 1B');
    
    expect(stack2ComponentsAfter.length).toBe(2);
    expect(stack2ComponentsAfter[0].getAttribute('title')).toBe('Component 2');
    expect(stack2ComponentsAfter[1].getAttribute('title')).toBe('Component 1A');
  });
});