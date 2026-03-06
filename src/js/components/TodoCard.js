import { Component, html, Backend, If, Loop } from 'veda-client';

export default class TodoCard extends Component(HTMLElement) {
  static tag = 'todo-card';

  get classList (){
    return [
      this.todo.completed ? 'todo-card--completed' : ''
    ].join(' ');
  }

  get todoId() {
    return this.todo.id;
  }

  get todo() {
    return this.state.todo
  }

  handleDelete() {
    this.dispatchEvent(new CustomEvent('todo-delete', {
      detail: { id: this.todoId },
      bubbles: true
    }));
  }

  handleComplete() {
    this.dispatchEvent(new CustomEvent('todo-complete', {
      detail: { id: this.todoId },
      bubbles: true
    }));
  }

  render() {
    return html`
      <div class="todo-card {classList}">
        <div class="todo-card-content">
          <div class="todo-card-header">
            <h3 class="todo-card-title">
              {this.todo.name}
            </h3>
            <div class="todo-card-actions">
              <button 
                class="todo-card-btn todo-card-btn--complete"
                onclick="{this.handleComplete}"
              >
                <svg class="todo-card-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </button>
              <button 
                class="todo-card-btn todo-card-btn--delete"
                onclick="{this.handleDelete}"
                title="Delete todo"
              >
                <svg class="todo-card-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="todo-card-description">
            {this.todo.desc}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(TodoCard.tag, TodoCard);
