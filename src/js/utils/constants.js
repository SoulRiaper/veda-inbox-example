/**
 * Application constants
 */

// Node dimensions
export const NODE_DIMENSIONS = {
  TASK_WIDTH: 120,
  TASK_HEIGHT: 60,
  CONDITION_RADIUS: 20,
  NODE_GAP: 12,
  TASK_MAX_OFFSET: 22,
  CONDITION_MAX_OFFSET: 12,
  CONDITION_PORT_SEPARATION: 6, // separation between incoming and outgoing ports on same side
};

// Gateway decorator dimensions
export const GATEWAY_DIMENSIONS = {
  TRIANGLE_WIDTH: 15,         // width of the triangle (depth from edge)
  TRIANGLE_HEIGHT: 30,        // half-height = matches task half-height (hh)
};

// RDF/RDFS property paths
export const PROPERTY_PATHS = {
  TYPE: 'rdf:type',
  LABEL: 'rdfs:label',
  COMMENT: 'rdfs:comment',
  POSITION: 'v-wf2:position',
  TASK_TYPE: 'v-wf2:taskType',
  SPLIT_TYPE: 'v-wf2:splitType',
  JOIN_TYPE: 'v-wf2:joinType',
  CONDITION_TYPE: 'v-wf2:conditionType',
  FLOW_FROM: 'v-wf2:flowFrom',
  FLOW_TO: 'v-wf2:flowTo',
  GUARD: 'v-wf2:guard',
  PRIORITY: 'v-wf2:priority',
  IS_DEFAULT: 'v-wf2:isDefault',
  TIMEOUT: 'v-wf2:timeout',
  REMINDER: 'v-wf2:reminder',
  ON_START: 'v-wf2:onStart',
  ON_COMPLETE: 'v-wf2:onComplete',
  ASYNC: 'v-wf2:async',
  HANDLER: 'v-wf2:handler',
  TOPIC: 'v-wf2:topic',
  ON_TIMEOUT: 'v-wf2:onTimeout',
  ESCALATE_TO: 'v-wf2:escalateTo',
  MULTI_INSTANCE: 'v-wf2:multiInstance',
  MULTI_INSTANCE_COLLECTION: 'v-wf2:multiInstanceCollection',
  SUBPROCESS: 'v-wf2:subprocess',
  EXECUTOR: 'v-wf2:executor',
  DECISION_CLASS: 'v-wf2:decisionClass',
  ROUTE_HINT: 'v-wf2:routeHint',
  INHERIT_DOCUMENT: 'v-wf2:inheritDocument',
  NET_VERSION: 'v-wf2:netVersion',
  TRIGGER_EVENT: 'v-wf2:triggerEvent',
  CONSISTS_OF: 'v-wf2:consistsOf',
  BELONGS_TO: 'v-wf2:belongsTo',
  INPUT_CONDITION: 'v-wf2:inputCondition',
  OUTPUT_CONDITION: 'v-wf2:outputCondition',
};

// Type URIs
export const TYPE_URIS = {
  NET: 'v-wf2:Net',
  TASK: 'v-wf2:Task',
  CONDITION: 'v-wf2:Condition',
  FLOW: 'v-wf2:Flow',
  
  // Task types
  MANUAL_TASK: 'v-wf2:ManualTask',
  AUTOMATIC_TASK: 'v-wf2:AutomaticTask',
  SUBPROCESS_TASK: 'v-wf2:SubprocessTask',
  EXTERNAL_TASK: 'v-wf2:ExternalTask',
  
  // Condition types
  INPUT_CONDITION: 'v-wf2:InputConditionType',
  OUTPUT_CONDITION: 'v-wf2:OutputConditionType',
  INTERMEDIATE_CONDITION: 'v-wf2:IntermediateConditionType',
  
  // Gateway types
  AND_SPLIT: 'v-wf2:AndSplit',
  XOR_SPLIT: 'v-wf2:XorSplit',
  AND_JOIN: 'v-wf2:AndJoin',
  XOR_JOIN: 'v-wf2:XorJoin',

  // Timeout actions
  ESCALATE_ACTION: 'v-wf2:EscalateAction',
  AUTO_COMPLETE_ACTION: 'v-wf2:AutoCompleteAction',
  CANCEL_ACTION: 'v-wf2:CancelAction',

};

// Validation limits
export const VALIDATION_LIMITS = {
  MIN_VERSION: 1,
  MAX_VERSION: 1000,
  MAX_LABEL_LENGTH: 200,
  MAX_COMMENT_LENGTH: 2000,
  MAX_TIMEOUT_DAYS: 365,
};

// Default values
export const DEFAULTS = {
  NET_VERSION: 1,
  POSITION: { x: 0, y: 0 },
  NEW_NET_NAME: 'New Workflow',
  NEW_TASK_NAME: 'New Task',
  NEW_CONDITION_NAME: 'Condition',
  START_CONDITION_NAME: 'Start',
  END_CONDITION_NAME: 'End',
  START_POSITION: { x: 100, y: 300 },
  END_POSITION: { x: 700, y: 300 },
};

// Tools
export const TOOLS = {
  SELECT: 'select',
  PAN: 'pan',
  TASK: 'task',
  CONDITION: 'condition',
  FLOW: 'flow',
};

// Keyboard shortcuts
// Uses both 'key' (for special keys) and 'code' (for layout-independent letters)
export const KEYBOARD_SHORTCUTS = {
  SELECT: { keys: ['escape'], codes: ['KeyV'] },
  TASK: { keys: [], codes: ['KeyT'] },
  CONDITION: { keys: [], codes: ['KeyC'] },
  FLOW: { keys: [], codes: ['KeyF'] },
  DELETE: { keys: ['delete', 'backspace'], codes: [] },
  ZOOM_IN: { keys: ['+', '='], codes: [] },
  ZOOM_OUT: { keys: ['-'], codes: [] },
  RESET_ZOOM: { keys: ['0'], codes: ['Digit0'] },
  SAVE: { keys: [], codes: ['KeyS'] },
  PAN: { keys: [' '], codes: ['Space'] },
};

/**
 * Check if keyboard event matches a shortcut (layout-independent)
 */
export function matchesShortcut(event, shortcut) {
  const key = event.key.toLowerCase();
  const code = event.code;
  return shortcut.keys.includes(key) || shortcut.codes.includes(code);
}

// Zoom limits
export const ZOOM_LIMITS = {
  MIN: 0.1,
  MAX: 3,
  STEP: 0.1,
  DEFAULT: 1,
};

// Query limits
export const QUERY_LIMITS = {
  DEFAULT_NETS_LIMIT: 100,
  DEFAULT_PROCESSES_LIMIT: 500,
};

// Resizable panel limits (px)
export const PANEL_WIDTH = {
  SIDEBAR_DEFAULT: 280,
  SIDEBAR_MIN: 180,
  SIDEBAR_MAX: 500,
  RIGHT_DEFAULT: 320,
  RIGHT_MIN: 200,
  RIGHT_MAX: 560,
  PROCESSES_SIDEBAR_DEFAULT: 340,
  PROCESSES_SIDEBAR_MIN: 260,
  PROCESSES_SIDEBAR_MAX: 500,
  PDP_PANEL_DEFAULT: 260,
  PDP_PANEL_MIN: 200,
  PDP_PANEL_MAX: 560,
};

// Flow rendering (orthogonal router)
export const FLOW_RENDERING = {
  SHAPE_MARGIN: 15,
  STUB_LENGTH: 20,
  CORNER_RADIUS: 6,
  TURN_PENALTY: 25,
  GLOBAL_MARGIN: 50,
};

// Fit to view
export const FIT_TO_VIEW = {
  PADDING: 50,
  MIN_ZOOM: 0.2,
};
