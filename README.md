# Golden Layout - Web Components Edition

A modern port of Golden Layout using Web Components, Vite, and Vitest.

## Features

- 🎯 Native Web Components - no framework dependencies
- 📦 ES Modules only - modern JavaScript
- 🎨 Styled with Open Props - modern CSS design tokens
- ⚡ Built with Vite - fast development and builds
- 🧪 Tested with Vitest - modern testing experience
- 🔧 TypeScript - full type safety

## Installation

```bash
npm install golden-layout@next
```

## Usage

### HTML

```html
<link rel="stylesheet" href="golden-layout/styles">
<script type="module">
  import 'golden-layout';
</script>

<gl-layout>
  <gl-row>
    <gl-stack>
      <gl-component-container title="Component 1">
        <div>Your content here</div>
      </gl-component-container>
    </gl-stack>
  </gl-row>
</gl-layout>
```

### JavaScript

```javascript
import 'golden-layout';
import 'golden-layout/styles';

const layout = document.querySelector('gl-layout');
layout.addEventListener('tab-changed', (e) => {
  console.log('Tab changed:', e.detail);
});
```

## Components

- `<gl-layout>` - Main container
- `<gl-stack>` - Tabbed container
- `<gl-row>` - Horizontal layout
- `<gl-column>` - Vertical layout
- `<gl-component-container>` - Content wrapper
- `<gl-splitter>` - Resize handle
- `<gl-header>` - Tab bar
- `<gl-tab>` - Individual tab

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Migration from v2

See [MIGRATION.md](./MIGRATION.md) for upgrading from Golden Layout v2.

## License

MIT