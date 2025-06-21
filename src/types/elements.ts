import type { GlColumn } from '@/components/gl-column';
import type { GlComponentContainer } from '@/components/gl-component-container';
import type { GlDropIndicator } from '@/components/gl-drop-indicator';
import type { GlLayout } from '@/components/gl-layout';
import type { GlPane } from '@/components/gl-pane';
import type { GlRow } from '@/components/gl-row';
import type { GlSplitter } from '@/components/gl-splitter';

// Define the custom element interfaces
export interface GlLayoutElement extends GlLayout, HTMLElement {
  draggedElement: HTMLElement | null;
  dropIndicator: GlDropIndicator | null;
}
export interface GlPaneElement extends GlPane, HTMLElement {}
export interface GlRowElement extends GlRow, HTMLElement {}
export interface GlColumnElement extends GlColumn, HTMLElement {}
export interface GlDropIndicatorElement extends GlDropIndicator, HTMLElement {}
export interface GlSplitterElement extends GlSplitter, HTMLElement {}
export interface GlComponentContainerElement extends GlComponentContainer, HTMLElement {}

// Declare the custom element types for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'gl-layout': GlLayoutElement;
    'gl-pane': GlPaneElement;
    'gl-row': GlRowElement;
    'gl-column': GlColumnElement;
    'gl-drop-indicator': GlDropIndicatorElement;
    'gl-splitter': GlSplitterElement;
    'gl-component-container': GlComponentContainerElement;
  }
}
