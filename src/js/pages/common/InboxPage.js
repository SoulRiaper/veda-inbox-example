import { Backend, Component, html, If, Loop, Model } from 'veda-client';
import InboxCard from '../../components/InboxCard';
import Tabs from '../../components/Tabs';

export default class InboxPage extends Component(HTMLElement) {
  static tag = 'inbox-page';

  constructor() {
    super();

    this.state.tabs = [
      { id: 'incoming', label: 'Входящие', active: true, disabled: false},
      { id: 'outgoing', label: 'Исходящие', active: false, disabled: false},
      { id: 'incomingCompleted', label: 'Входящие выполненные', active: false, disabled: false},
      { id: 'outgoingCompleted', label: 'Исходящие выполненные', active: false, disabled: false},
    ]
    this.state.showCompleted = false;
  }

  get hasInbox() {
    return this.state.inboxes?.length > 0;
  }

  get currentTab() {
    return this.state.tabs.find(t => t.active);
  }

  get isIncoming() {
    return this.currentTab.id.includes('incoming')
  }

  async connectedCallback() {
    await super.connectedCallback();

    this.effect(async() => {
      const tag = this.isIncoming ? 'v-wf:to' : 'v-wf:from';
      const showCompleted = this.currentTab.id.includes('Completed') ? 'true' : 'false'

      const res = await Backend.query(`(('rdf:type'=='v-wf:DecisionForm') && ('v-wf:isCompleted'=='${showCompleted}') && ('${tag}'=='${Backend.user_uri}' ) )`, `'v-s:created' desc`);

      const promises = res.result.map(id => {
        const ind = new Model(id);
        return ind.load();
      });

      this.state.inboxes = await Promise.all(promises);
    })

    this.addEventListener('tab-change', this.handleTabClick);
  }

  handleTabClick(e) {
    const { tab } = e.detail;
    
    this.state.tabs = this.state.tabs.map(t => ({...t, active: t.id === tab.id}))
  }

  render() {
    return html`
      <div class="inbox-page">
        <div class="inbox-header">
          <div class="inbox-header-controls">
            <${Tabs} :tabs={this.state.tabs}></${Tabs}>
            
            <!--- <div class="inbox-filter-checkbox">
              <label class="checkbox-label">
                <input type="checkbox" onchange="{handleCompletedToggle}" />
                <span class="checkbox-text">Показать выполненные</span>
              </label>
            </div> ---!> 
          </div>
        </div>
        
        <div class="inbox-content">
          <${If} condition="{!this.hasInbox}">
            <div class="inbox-empty-state">
              <div class="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>

              <h3>Нет сообщений</h3>

              <p>
                Здесь будут отображаться ваши сообщения, когда они появятся.
              </p>
            </div>
          </${If}>

          <${If} condition="{this.hasInbox}">
            <${Loop} items="{this.state.inboxes}" as="inbox" key="id">
              <${InboxCard} :inbox="{inbox}" :show-decision="{this.isIncoming}"/>
            </${Loop}>
          </${If}>
        </div>
      </div>
    `;
  }
}

customElements.define(InboxPage.tag, InboxPage);
