export abstract class BaseElement extends HTMLElement {
  protected _isConnected = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this._isConnected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this._isConnected = false;
  }

  protected abstract render(): void;

  protected emit<T = unknown>(eventName: string, detail?: T): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected createStyleSheet(css: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
  }
}
