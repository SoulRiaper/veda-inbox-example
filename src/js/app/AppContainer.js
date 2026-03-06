import { Component, html } from 'veda-client';
import { setupRoutes } from './routes.js';
import InboxPage from '../pages/common/InboxPage.js';

export default class AppContainer extends Component(HTMLElement) {
  static tag = 'app-container';

  constructor() {
    super();

    this.state.todos = [];
    this.state._currentView = 'inbox';
  }

  async connectedCallback() {
    await super.connectedCallback();

    setupRoutes(this);
  }

  render() {
    return html`
      <div class="app-container">
        <div class="app-content">
          <div class="inbox-view">
            <${InboxPage} />
          </div>
        </div>
      </div>
    `;
  }
}
