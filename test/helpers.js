/**
 * Test helpers for veda-workflow-manager
 */

import { flushEffects } from 'veda-client';

/**
 * Creates a test component with automatic cleanup
 * @param {Function} ComponentClass - Component class constructor
 * @param {Object} options - Configuration options
 * @param {Function} options.setup - Setup function called before component is added to DOM
 * @param {boolean} options.autoRender - Whether to wait for render (default: true)
 * @returns {Promise<{component, container, cleanup}>}
 */
export async function createTestComponent(ComponentClass, options = {}) {
  const { setup = null, autoRender = true } = options;

  // Generate unique tag name to avoid conflicts
  const tag = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  ComponentClass.tag = tag;

  if (!customElements.get(tag)) {
    customElements.define(tag, ComponentClass);
  }

  const container = document.createElement('div');
  document.body.appendChild(container);

  const component = document.createElement(tag);

  // Setup before adding to DOM
  if (setup) {
    setup(component);
  }

  container.appendChild(component);

  // Wait for render if requested
  if (autoRender) {
    await component.rendered;
    await flushEffects();
  }

  const cleanup = () => {
    container.remove();
  };

  return { component, container, cleanup };
}

/**
 * Waits for a condition to be true with timeout
 * @param {Function} condition - Function that returns boolean or Promise<boolean>
 * @param {Object} options - Configuration
 * @param {number} options.timeout - Timeout in ms (default: 5000)
 * @param {number} options.interval - Check interval in ms (default: 50)
 * @param {string} options.message - Error message to show on timeout
 * @returns {Promise<void>}
 */
export async function waitForCondition(condition, options = {}) {
  const {
    timeout = 5000,
    interval = 50,
    message = 'Condition was not met'
  } = options;

  const startTime = Date.now();
  let lastError = null;

  while (Date.now() - startTime < timeout) {
    try {
      await flushEffects();
      const result = await Promise.resolve(condition());
      if (result) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  const elapsed = Date.now() - startTime;
  const errorMsg = `${message} (waited ${elapsed}ms)${lastError ? ': ' + lastError.message : ''}`;
  throw new Error(errorMsg);
}

/**
 * Polls for a value to equal expected
 * @param {Function} getter - Function that returns current value
 * @param {*} expected - Expected value
 * @param {Object} options - Same as waitForCondition
 */
export async function waitForValue(getter, expected, options = {}) {
  await waitForCondition(
    () => getter() === expected,
    {
      ...options,
      message: options.message || `Expected value to be ${expected}, but got ${getter()}`
    }
  );
}

/**
 * Creates a spy function for tracking calls
 * @returns {{fn: Function, calls: Array, called: boolean, callCount: number}}
 */
export function createSpy() {
  const spy = {
    calls: [],
    get called() { return this.calls.length > 0; },
    get callCount() { return this.calls.length; },
    reset() { this.calls = []; }
  };

  spy.fn = function(...args) {
    spy.calls.push(args);
    return args;
  };

  return spy;
}

/**
 * Captures console output for testing
 * @param {Function} fn - Function to run while capturing
 * @param {string} method - Console method to capture (log, warn, error)
 * @returns {Promise<string[]>} Array of captured messages
 */
export async function captureConsole(fn, method = 'error') {
  const messages = [];
  const original = console[method];

  console[method] = (...args) => {
    messages.push(args.join(' '));
  };

  try {
    await fn();
  } finally {
    console[method] = original;
  }

  return messages;
}

/**
 * Creates a mock workflow element
 * @param {string} type - Element type ('task', 'condition', 'flow')
 * @param {Object} props - Additional properties
 * @returns {Object} Mock element
 */
export function createMockElement(type, props = {}) {
  const id = props.id || `d:test_${type}_${Date.now()}`;
  
  const baseElement = {
    id,
    '@': id,
    'rdf:type': [{ id: getTypeUri(type) }],
    'rdfs:label': [props.label || `Test ${type}`]
  };

  if (type === 'task' || type === 'condition') {
    baseElement['v-wf2:position'] = [JSON.stringify(props.position || { x: 100, y: 100 })];
  }

  if (type === 'task') {
    baseElement['v-wf2:taskType'] = [{ 
      id: props.taskType || 'v-wf2:ManualTask'
    }];
  }

  if (type === 'condition') {
    baseElement['v-wf2:conditionType'] = [{ 
      id: props.conditionType || 'v-wf2:InputConditionType'
    }];
  }

  if (type === 'flow') {
    baseElement['v-wf2:flowsInto'] = [{ 
      id: props.target || 'd:test_target'
    }];
  }

  return baseElement;
}

/**
 * Helper to get type URI for element type
 */
function getTypeUri(type) {
  const types = {
    task: 'v-wf2:Task',
    condition: 'v-wf2:Condition',
    flow: 'v-wf2:Flow',
    net: 'v-wf2:Net'
  };
  return types[type] || 'v-s:Thing';
}

/**
 * Creates a mock workflow net with elements
 * @param {Object} options - Configuration
 * @returns {Object} Mock net with tasks, conditions, flows
 */
export function createMockNet(options = {}) {
  const {
    taskCount = 2,
    conditionCount = 2,
    flowCount = 2
  } = options;

  const net = {
    '@': `d:test_net_${Date.now()}`,
    'rdf:type': [{ data: 'v-wf2:Net', type: 'Uri' }],
    'rdfs:label': [{ data: 'Test Net', type: 'String' }],
    'v-wf2:netVersion': [{ data: '1.0', type: 'String' }]
  };

  const tasks = Array.from({ length: taskCount }, (_, i) =>
    createMockElement('task', { 
      label: `Task ${i + 1}`,
      position: { x: 100 + i * 200, y: 100 }
    })
  );

  const conditions = Array.from({ length: conditionCount }, (_, i) =>
    createMockElement('condition', { 
      label: `Condition ${i + 1}`,
      position: { x: 100 + i * 200, y: 300 }
    })
  );

  const flows = Array.from({ length: flowCount }, (_, i) =>
    createMockElement('flow', { 
      label: `Flow ${i + 1}`,
      target: conditions[i % conditionCount]['@']
    })
  );

  return { net, tasks, conditions, flows };
}

/**
 * Generates unique ID for tests
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateTestId(prefix = 'd:test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Retry operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Configuration
 */
export async function retry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    shouldRetry = () => true
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}
