// Export all components
export { GlLayout } from './components/gl-layout';
export { GlStack } from './components/gl-stack';
export { GlHeader } from './components/gl-header';
export { GlTab } from './components/gl-tab';
export { GlComponentContainer } from './components/gl-component-container';
export { GlRow } from './components/gl-row';
export { GlColumn } from './components/gl-column';
export { GlSplitter } from './components/gl-splitter';

// Export types
export type { LayoutConfig, ItemConfig, ComponentConfig, Size, Position } from './types/config';

// Auto-register all components when the module is imported
import './components/gl-layout';
import './components/gl-stack';
import './components/gl-header';
import './components/gl-tab';
import './components/gl-component-container';
import './components/gl-row';
import './components/gl-column';
import './components/gl-splitter';
