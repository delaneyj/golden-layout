export interface ComponentConfig {
  title: string;
  type?: string;
  componentState?: Record<string, unknown>;
}

export interface ItemConfig {
  type: 'row' | 'column' | 'stack' | 'component';
  content?: ItemConfig[];
  componentName?: string;
  componentState?: Record<string, unknown>;
  title?: string;
  width?: number;
  height?: number;
  isClosable?: boolean;
}

export interface LayoutConfig {
  root: ItemConfig;
  settings?: {
    hasHeaders?: boolean;
    constrainDragToContainer?: boolean;
    reorderEnabled?: boolean;
    selectionEnabled?: boolean;
    showPopoutIcon?: boolean;
    showMaximiseIcon?: boolean;
    showCloseIcon?: boolean;
  };
}

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}
