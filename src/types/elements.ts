import type { GlTab } from '../components/gl-tab';
import type { GlStack } from '../components/gl-stack';

// Define the custom element interfaces
export interface GlTabElement extends GlTab, HTMLElement {}
export interface GlStackElement extends GlStack, HTMLElement {}

// Declare the custom element types for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'gl-tab': GlTabElement;
    'gl-stack': GlStackElement;
  }
}
