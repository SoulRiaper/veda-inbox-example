import { Component, html, Loop } from 'veda-client';

// TODO: сделать обработку value там обрабатываем массив, по нему выставляется active

export default class Tabs extends Component(HTMLElement) {
  static tag = 'v-tabs';

  constructor() {
    super();
  }

  get tabs() {
    return this.state.tabs || [];
  }

  handleTabClick(e) {
    const id = e.target.dataset.id;
    const tab = this.state.tabs.find(t => t.id === id);

    if (!tab || tab.disabled) {
      return;
    }

    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: {
        tab
      },
      bubbles: true
    }));
  }

  render() {
    return html`
      <div class="tabs">
        <div class="tabs-container">
          <${Loop} items="{this.tabs}" as="tab" key="id">
            <button
              class="tabs-btn {tab.active ? 'active' : ''} {tab.disabled ? 'disabled' : ''}"
              onclick="{handleTabClick}"
              disabled="{tab.disabled}"
              data-id="{tab.id}"
            >
              {tab.label}
            </button>
          </${Loop}>
        </div>
      </div>
    `;
  }
}

customElements.define(Tabs.tag, Tabs);
