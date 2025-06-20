# Migration from Tabs to Non-Modal Panes

Golden Layout has been refactored to use a non-modal pane system similar to professional applications like Blender, Nuke, and DaVinci Resolve. This removes the tabbed interface in favor of direct content display in each pane.

## Key Changes

### 1. Replace `gl-stack` with `gl-pane`

**Before:**
```html
<gl-stack>
  <gl-component-container title="Component 1">
    <div>Content 1</div>
  </gl-component-container>
  <gl-component-container title="Component 2">
    <div>Content 2</div>
  </gl-component-container>
</gl-stack>
```

**After:**
```html
<gl-pane title="Component 1">
  <gl-component-container>
    <div>Content 1</div>
  </gl-component-container>
</gl-pane>
```

### 2. No More Tabs

- Each pane shows exactly one component
- No tab switching - all content is visible
- Panes have a header with title and controls (maximize, close)

### 3. Drag and Drop Changes

**Before:** Drag tabs between stacks
**After:** Drag entire panes by their headers

- Drag pane headers to rearrange layout
- Drop on edges (top, right, bottom, left) to create splits
- Same intelligent drop zone detection

### 4. API Changes

**Removed:**
- `gl-stack` component
- `gl-tab` component  
- `gl-header` component
- Tab-related events (`tab-clicked`, `tab-close-requested`, etc.)

**Added:**
- `gl-pane` component
- Pane events:
  - `pane-drag-start`
  - `pane-drag-end`
  - `pane-close`
  - `pane-moved`
  - `maximize-changed`

### 5. Styling Changes

CSS variables have been updated:

```css
/* Old */
--gl-stack-bg
--gl-stack-border
--gl-stack-drag-over-*

/* New */
--gl-pane-bg
--gl-pane-border  
--gl-pane-drag-over-*
```

## Benefits

1. **Cleaner UI** - No tab clutter, direct content access
2. **Professional Workflow** - Similar to industry-standard tools
3. **Better Space Utilization** - No space wasted on tab bars
4. **Simpler Mental Model** - One pane = one component

## Example Layout

```html
<gl-layout>
  <gl-row>
    <gl-pane title="Editor" data-width="60%">
      <gl-component-container>
        <!-- Editor content -->
      </gl-component-container>
    </gl-pane>
    
    <gl-splitter orientation="horizontal"></gl-splitter>
    
    <gl-column data-width="40%">
      <gl-pane title="Properties" data-height="50%">
        <gl-component-container>
          <!-- Properties content -->
        </gl-component-container>
      </gl-pane>
      
      <gl-splitter orientation="vertical"></gl-splitter>
      
      <gl-pane title="Console" data-height="50%">
        <gl-component-container>
          <!-- Console content -->
        </gl-component-container>
      </gl-pane>
    </gl-column>
  </gl-row>
</gl-layout>
```

## Test Migration

Tests need to be updated to:
1. Replace `gl-stack` with `gl-pane`
2. Remove tab-related queries and interactions
3. Update drag source from tabs to pane headers
4. Adjust event names

See `test/unit/pane.test.ts` for examples of the new test patterns.