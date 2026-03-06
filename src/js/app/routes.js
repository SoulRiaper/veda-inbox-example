/**
 * Hash-based routing using veda-client Router.
 * Syncs URL with app state: view (designer/processes), selected net, selected process.
 */

import { Router, Model } from 'veda-client';
import { WorkflowService } from '../services/WorkflowService.js';

const ROUTES = {
  DESIGNER: '#/designer',
  DESIGNER_NET: '#/designer/net/:netId',
  PROCESSES: '#/processes',
  PROCESSES_PROCESS: '#/processes/:processId',
  INBOX: '#/inbox',
};

export const router = new Router();

function decodeParam (s) {
  if (!s) return '';
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Setup routes for WorkflowManagerApp.
 * Call from app's connectedCallback with app instance.
 * Clears existing routes to avoid duplicates on re-mount.
 */
export function setupRoutes (app) {
  router.clear();
  router.add('#/', () => router.go(ROUTES.DESIGNER));
  router.add('#/designer', () => applyDesigner(app));
  router.add('#/designer/net/:netId', (netId) => applyDesignerNet(app, decodeParam(netId)));
  router.add('#/processes', () => applyProcesses(app));
  router.add('#/processes/:processId', (processId) => applyProcessesProcess(app, decodeParam(processId)));
  router.add('#/inbox', () => applyInbox(app));

  router.route(location.hash || ROUTES.DESIGNER);
}

function applyDesigner (app) {
  app
  app.state.managedProcess = null;
  app.state.currentNet = null;
  app.state.selectedElement = null;
  app.state.selectedProcess = null;
  app.state.executionMode = false;
}

async function applyDesignerNet (app, netId) {
  app.state.currentView = 'designer';
  app.state.managedProcess = null;
  if (!netId) {
    app.state.currentNet = null;
    app.state.selectedElement = null;
    app.state.selectedProcess = null;
    app.state.executionMode = false;
    return;
  }
  try {
    const net = await WorkflowService.loadNet(netId);
    app.state.currentNet = net;
    app.state.selectedElement = net;
    app.state.selectedProcess = null;
    app.state.executionMode = false;
    requestAnimationFrame(() => app.fitToContent?.());
  } catch (error) {
    app.showError?.('Failed to load workflow', error);
  }
}

function applyProcesses (app) {
  app.state.currentView = 'processes';
  app.state.managedProcess = null;
}

async function applyProcessesProcess (app, processId) {
  app.state.currentView = 'processes';
  if (!processId) {
    app.state.managedProcess = null;
    return;
  }
  try {
    const proc = new Model(processId);
    await proc.load();
    app.state.managedProcess = proc;
  } catch (error) {
    app.showError?.('Failed to load process', error);
    app.state.managedProcess = null;
  }
}

export function goDesigner () {
  router.go(ROUTES.DESIGNER);
}

export function goDesignerNet (netId) {
  if (!netId) {
    router.go(ROUTES.DESIGNER);
    return;
  }
  router.go(`#/designer/net/${encodeURIComponent(netId)}`);
}

export function goProcesses () {
  router.go(ROUTES.PROCESSES);
}

export function goProcessesProcess (processId) {
  if (!processId) {
    router.go(ROUTES.PROCESSES);
    return;
  }
  router.go(`#/processes/${encodeURIComponent(processId)}`);
}

function applyInbox (app) {
  app.state.currentView = 'inbox';
  app.state.managedProcess = null;
  app.state.currentNet = null;
  app.state.selectedElement = null;
  app.state.selectedProcess = null;
  app.state.executionMode = false;
}

export function goInbox () {
  router.go(ROUTES.INBOX);
}
