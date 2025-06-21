// Export all components
export { GlLayout } from '@/components/gl-layout';
export { GlPane } from '@/components/gl-pane';
export { GlComponentContainer } from '@/components/gl-component-container';
export { GlRow } from '@/components/gl-row';
export { GlColumn } from '@/components/gl-column';
export { GlSplitter } from '@/components/gl-splitter';
export { GlDropIndicator } from '@/components/gl-drop-indicator';

// Export types
export type { LayoutConfig, ItemConfig, ComponentConfig, Size, Position } from '@/types/config';

// Auto-register all components when the module is imported
import '@/components/gl-layout';
import '@/components/gl-pane';
import '@/components/gl-component-container';
import '@/components/gl-row';
import '@/components/gl-column';
import '@/components/gl-splitter';
import '@/components/gl-drop-indicator';
