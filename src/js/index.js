/**
 * Veda Workflow Manager
 * Visual editor and process manager for workflow nets (v-wf2:Net)
 */

import './install_sw.js';
import { Backend, Subscription } from 'veda-client';
import AppContainer from './app/AppContainer.js';

// Initialize backend and WebSocket subscription channel
Backend.init('http://localhost/api/');
await Backend.authenticate('veda', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3')
Subscription.init('ws://localhost:8089');

// Register app container
customElements.define(AppContainer.tag, AppContainer);
