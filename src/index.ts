// Export all components
export { TilexLayout } from '@/components/tx-layout';
export { TilexPane } from '@/components/tx-pane';
export { TilexRow } from '@/components/tx-row';
export { TilexColumn } from '@/components/tx-column';
export { TilexSplitter } from '@/components/tx-splitter';
export { TilexDropIndicator } from '@/components/tx-drop-indicator';

// Export types
export type { LayoutConfig, ItemConfig, ComponentConfig, Size, Position } from '@/types/config';

// Auto-register all components when the module is imported
import '@/components/tx-layout';
import '@/components/tx-pane';
import '@/components/tx-row';
import '@/components/tx-column';
import '@/components/tx-splitter';
import '@/components/tx-drop-indicator';
