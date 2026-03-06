import { Component, html, If } from 'veda-client';
import { formatDate, formatInitials } from '../utils/format-helpers';
import { stringToHslColor } from '../utils/avatar-color';

export default class InboxCard extends Component(HTMLElement) {
  static tag = 'inbox-card';

  get inbox() {
    return this.state.inbox;
  }

  get responsibleInfo() {
    const resp = this.state.responsible

    if (!resp) {
      return {
        initials: '',
        label: ''
      }
    }

    return {
      initials: formatInitials(resp.toLabel()),
      label: resp.toLabel(),
      color: stringToHslColor(resp.toLabel(), 50, 50)
    }
  }

  get documentInfo() {
    return this.state.document?.toLabel() || '';
  }

  get formattedDate () {
    return formatDate(this.inbox['v-s:created'][0]);
  }

  async connectedCallback() {
    await super.connectedCallback();
    
    // Загружаем данные при монтировании
    const resp = this.state.inbox['v-wf:to'][0];
    const doc = this.state.inbox['v-wf:onDocument'][0];
    if (resp) {
      this.state.responsible = await resp.load();
      this.state.document = await doc.load();
    }
  }

  render() {
    return html`
      <div class="inbox-card">
        <div class="inbox-card-header">
          <div class="inbox-card-sender">
            <div style="background-color:{this.responsibleInfo.color}" class="inbox-card-avatar">
              {this.responsibleInfo.initials}
            </div>
            <div class="inbox-card-sender-name">{this.responsibleInfo.label}</div>
          </div>
          
          <div class="inbox-card-meta">
            <div class="inbox-card-date">
              {this.formattedDate}
            </div>
          </div>
        </div>
        
        <div class="inbox-card-content">
          <div class="inbox-card-preview">
            {this.documentInfo}
          </div>
        </div>
        
        <div class="inbox-card-actions">
          <${If} condition="{this.state.showDecision}">
            <button class="inbox-card-btn inbox-card-btn--reply">
              <span class="inbox-card-btn-label">
                {this.inbox.toLabel()}
              </span>
            </button>
          </${If}>

          <button class="inbox-card-btn inbox-card-btn--read">
            <span class="inbox-card-btn-label">
              В документ
            </span>
          </button>
          
          <button class="inbox-card-btn inbox-card-btn--archive">
            <span class="inbox-card-btn-label">
              В журнал
            </span>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define(InboxCard.tag, InboxCard);