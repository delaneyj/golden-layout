import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/index';

interface ComponentWithState extends HTMLElement {
  componentState: Record<string, unknown>;
  getState(): Record<string, unknown>;
  updateState(updates: Record<string, unknown>): void;
  readonly title: string;
}

describe('component state', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('maintains component state', async () => {
    const initialState = { testValue: 'initial', count: 0 };

    container.innerHTML = `
      <tx-layout>
        <tx-pane>
          
            <div id="content">Content</div>
          
        </tx-pane>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('tx-component-container') as ComponentWithState;

    // Set initial state
    component.componentState = initialState;

    // Verify state is stored
    expect(component.componentState).toEqual(initialState);
    expect(component.getState()).toEqual(initialState);
  });

  it('emits state-changed event when state updates', async () => {
    const stateChangedHandler = vi.fn();

    container.innerHTML = `
      
        <div>Content</div>
      
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('tx-component-container') as ComponentWithState;
    component.addEventListener('state-changed', stateChangedHandler);

    // Update state
    const newState = { testValue: 'updated', count: 1 };
    component.componentState = newState;

    expect(stateChangedHandler).toHaveBeenCalledTimes(1);
    expect(stateChangedHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { state: newState },
      }),
    );
  });

  it('updates state partially', async () => {
    container.innerHTML = `
      
        <div>Content</div>
      
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('tx-component-container') as ComponentWithState;

    // Set initial state
    component.componentState = { foo: 'bar', count: 1 };

    // Update state partially
    component.updateState({ count: 2, newProp: 'value' });

    // Verify merged state
    expect(component.getState()).toEqual({
      foo: 'bar',
      count: 2,
      newProp: 'value',
    });
  });

  it('preserves state when moving components', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane id="stack1">
            
              <div>Content</div>
            
          </tx-pane>
          <tx-pane id="stack2">
            <!-- Empty stack -->
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('#stateful') as ComponentWithState;
    const stack2 = container.querySelector('#stack2');

    // Set state
    const state = { data: 'important', version: 1 };
    component.componentState = state;

    // Move component to stack2
    stack2?.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // State should be preserved
    expect(component.componentState).toEqual(state);
  });

  it('emits component-created with initial state', async () => {
    const createdHandler = vi.fn();

    const testDiv = document.createElement('div');
    testDiv.innerHTML = `
      
        <div>Content</div>
      
    `;

    const component = testDiv.querySelector('tx-component-container') as ComponentWithState;

    // Set state before adding to DOM
    const initialState = { preloaded: true };
    component.componentState = initialState;

    // Listen for creation event
    component.addEventListener('component-created', createdHandler);

    // Add to DOM
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(createdHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          title: 'Test Component',
          state: initialState,
        }),
      }),
    );
  });

  it('cleans up state on component removal', async () => {
    const destroyedHandler = vi.fn();

    container.innerHTML = `
      
        <div>Content</div>
      
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const component = container.querySelector('tx-component-container') as ComponentWithState;
    component.addEventListener('component-destroyed', destroyedHandler);

    // Set state
    component.componentState = { willBeCleanedUp: true };

    // Remove component
    component.remove();

    expect(destroyedHandler).toHaveBeenCalledTimes(1);
  });

  it('serializes layout with component states', async () => {
    container.innerHTML = `
      <tx-layout>
        <tx-row>
          <tx-pane>
            
              <div>Content 1</div>
            
          </tx-pane>
          <tx-pane>
            
              <div>Content 2</div>
            
          </tx-pane>
        </tx-row>
      </tx-layout>
    `;

    await new Promise((resolve) => setTimeout(resolve, 50));

    const comp1 = container.querySelector('#comp1') as ComponentWithState;
    const comp2 = container.querySelector('#comp2') as ComponentWithState;

    // Set different states
    comp1.componentState = { value: 'first', index: 1 };
    comp2.componentState = { value: 'second', index: 2 };

    // Get states
    expect(comp1.getState()).toEqual({ value: 'first', index: 1 });
    expect(comp2.getState()).toEqual({ value: 'second', index: 2 });

    // In a real implementation, we would serialize the entire layout
    // For now, we verify each component maintains its state
    const components = container.querySelectorAll('tx-component-container');
    const states = Array.from(components).map((c) => ({
      title: (c as ComponentWithState).title,
      state: (c as ComponentWithState).getState(),
    }));

    expect(states).toEqual([
      { title: 'Component 1', state: { value: 'first', index: 1 } },
      { title: 'Component 2', state: { value: 'second', index: 2 } },
    ]);
  });
});
