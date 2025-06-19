## Plan: Port Golden Layout to Web Components with Vite/Vitest

### Phase 1: New Project Structure

Create fresh structure for Web Components:
```
golden-layout/
├── old/              # Existing implementation
├── src/
│   ├── components/   # Web Components
│   ├── core/        # Core utilities
│   ├── styles/      # CSS with Open Props
│   ├── types/       # TypeScript types
│   └── index.ts     # Main entry
├── test/
│   ├── unit/        # Component tests
│   └── integration/ # E2E tests
├── package.json     # New minimal package
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── biome.json
```

### Phase 2: Web Components Implementation

#### Key Components to Create

1. **gl-layout** (main container)
   - Root Web Component
   - Manages layout tree
   - Handles global drag & drop

2. **gl-stack** 
   - Tabbed container component
   - Manages active tab
   - Maximize/minimize functionality

3. **gl-header**
   - Tab bar with controls
   - Drag & drop for tab reordering

4. **gl-tab**
   - Individual tab element
   - Closable with button
   - Draggable for reordering

5. **gl-component-container**
   - Slot-based content wrapper
   - Lifecycle management

6. **gl-row** / **gl-column**
   - Flexbox-based layout
   - Contains child components

7. **gl-splitter**
   - Resize handle
   - Touch and mouse support

### Phase 3: Build Configuration

#### package.json
```json
{
  "name": "golden-layout",
  "version": "3.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/dom": "^9.0.0",
    "happy-dom": "^12.0.0",
    "typescript": "^5.0.0",
    "@biomejs/biome": "^1.0.0"
  },
  "dependencies": {
    "open-props": "^1.6.0"
  }
}
```

#### vite.config.ts
- Library mode
- ES modules only
- TypeScript support
- CSS with PostCSS

#### biome.json
- Modern linting rules
- Import sorting
- Formatting config

### Phase 5: Migration Strategy

1. **Core utilities first**:
   - Port EventEmitter → Custom Events
   - Port DragListener → Native drag events
   - Port utility functions

2. **Components bottom-up**:
   - Tab → Header → Stack
   - Splitter → Row/Column
   - ComponentContainer
   - Layout (root)

3. **Styling migration**:
   - LESS → Native CSS
   - Variables → Open Props tokens
   - Themes → CSS custom properties

4. **Testing migration**:
   - Karma tests → Vitest
   - Same test coverage
   - Better DX with Vitest UI

### Phase 6: API Design

#### HTML Usage
```html
<gl-layout>
  <gl-row>
    <gl-stack>
      <gl-component-container title="Component 1">
        <div>Content here</div>
      </gl-component-container>
    </gl-stack>
    <gl-column>
      <gl-stack>
        <gl-component-container title="Component 2">
          <div>More content</div>
        </gl-component-container>
      </gl-stack>
    </gl-column>
  </gl-row>
</gl-layout>
```

#### JavaScript Usage
```javascript
import 'golden-layout';
import 'golden-layout/styles';

const layout = document.querySelector('gl-layout');
layout.config = { /* configuration */ };
layout.addEventListener('tab-closed', (e) => {
  console.log('Tab closed:', e.detail);
});
```

### Benefits of This Approach

1. **Clean separation**: Old code preserved in `old/` for reference
2. **Modern stack**: Vite + Vitest + Biome
3. **ES6 only**: Simpler build, better tree-shaking
4. **Web standards**: Native Web Components
5. **Better testing**: Vitest is faster than Karma
6. **Improved DX**: Hot reload, better errors
7. **Smaller bundle**: No framework overhead