/**
 * TTL (Turtle RDF) exporter for workflow nets.
 *
 * Serializes the in-memory net model into a valid Turtle file
 * following the v-wf2 ontology conventions used by the workflow engine.
 */

import { ElementHelper } from '../utils/element-helpers.js';
import { PROPERTY_PATHS } from '../utils/constants.js';

// ── Prefix ↔ namespace maps ────────────────────────────────────────────────

const PREFIX_TO_NS = {
  'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  'xsd': 'http://www.w3.org/2001/XMLSchema#',
  'v-wf2': 'http://semantic-machines.com/veda/veda-workflow2/',
  'v-s': 'http://semantic-machines.com/veda/veda-schema/',
  'cfg': 'http://semantic-machines.com/veda/config/',
  'd': 'http://semantic-machines.com/veda/d/',
};

// ── Property lists per element type (controls output order) ─────────────────

const NET_PROPS = [
  'rdf:type',
  'rdfs:label',
  'rdfs:comment',
  'v-wf2:netVersion',
  'v-wf2:triggerEvent',
  'v-wf2:inputCondition',
  'v-wf2:outputCondition',
  'v-wf2:consistsOf',
];

const CONDITION_PROPS = [
  'rdf:type',
  'rdfs:label',
  'v-wf2:conditionType',
  'v-wf2:belongsTo',
  'v-wf2:onStart',
  'v-wf2:position',
];

const TASK_PROPS = [
  'rdf:type',
  'rdfs:label',
  'rdfs:comment',
  'v-wf2:taskType',
  'v-wf2:splitType',
  'v-wf2:joinType',
  'v-wf2:belongsTo',
  'v-wf2:executor',
  'v-wf2:decisionClass',
  'v-wf2:subprocess',
  'v-wf2:inheritDocument',
  'v-wf2:handler',
  'v-wf2:topic',
  'v-wf2:async',
  'v-wf2:multiInstance',
  'v-wf2:multiInstanceCollection',
  'v-wf2:timeout',
  'v-wf2:reminder',
  'v-wf2:onTimeout',
  'v-wf2:escalateTo',
  'v-wf2:onStart',
  'v-wf2:onComplete',
  'v-wf2:position',
];

const FLOW_PROPS = [
  'rdf:type',
  'rdfs:label',
  'v-wf2:flowFrom',
  'v-wf2:flowTo',
  'v-wf2:belongsTo',
  'v-wf2:guard',
  'v-wf2:priority',
  'v-wf2:isDefault',
  'v-wf2:routeHint',
];

// Properties rendered one-value-per-line when there are many values
const MULTI_LINE_THRESHOLD = 3;
const MULTI_LINE_PROPS = new Set([PROPERTY_PATHS.CONSISTS_OF]);

// Properties whose stored string should be coerced to integer
const INTEGER_PROPS = new Set([
  PROPERTY_PATHS.NET_VERSION,
  PROPERTY_PATHS.PRIORITY,
]);

// Properties whose stored string should be coerced to boolean
const BOOLEAN_PROPS = new Set([
  PROPERTY_PATHS.IS_DEFAULT,
  PROPERTY_PATHS.ASYNC,
  PROPERTY_PATHS.MULTI_INSTANCE,
  PROPERTY_PATHS.INHERIT_DOCUMENT,
]);

// ── Exporter ────────────────────────────────────────────────────────────────

export class TtlExporter {
  /**
   * Export net to a downloadable .ttl file
   */
  static exportToFile (net) {
    const ttl = this.serialize(net);
    const label = ElementHelper.getLabel(net) || 'workflow';
    const filename = sanitizeFilename(label) + '.ttl';
    download(ttl, filename);
  }

  /**
   * Serialize a complete net (with all its elements) to a TTL string
   */
  static serialize (net) {
    const elements = net[PROPERTY_PATHS.CONSISTS_OF] || [];

    // Group elements by type
    const conditions = [];
    const tasks = [];
    const flows = [];
    for (const el of elements) {
      if (ElementHelper.isCondition(el)) conditions.push(el);
      else if (ElementHelper.isTask(el)) tasks.push(el);
      else if (ElementHelper.isFlow(el)) flows.push(el);
    }

    // Sort conditions: input first, output second, then intermediate
    conditions.sort((a, b) => conditionOrder(a) - conditionOrder(b));

    // ── Collect used prefixes ──────────────────────────────────────────────

    const usedPrefixes = new Set();
    collectPrefixes(net, NET_PROPS, usedPrefixes);
    addPrefix(net.id, usedPrefixes);

    for (const el of elements) {
      const props = ElementHelper.isCondition(el) ? CONDITION_PROPS
        : ElementHelper.isTask(el) ? TASK_PROPS
        : FLOW_PROPS;
      collectPrefixes(el, props, usedPrefixes);
      addPrefix(el.id, usedPrefixes);
    }

    // ── Build output ───────────────────────────────────────────────────────

    const out = [];

    // Prefix declarations (sorted alphabetically)
    for (const prefix of [...usedPrefixes].sort()) {
      if (PREFIX_TO_NS[prefix]) {
        out.push(`@prefix ${prefix}: <${PREFIX_TO_NS[prefix]}> .`);
      }
    }
    out.push('');

    // Net
    out.push('# --- Net ---');
    out.push('');
    out.push(serializeElement(net, NET_PROPS));

    // Conditions
    if (conditions.length > 0) {
      out.push('# --- Conditions ---');
      out.push('');
      for (const el of conditions) {
        out.push(serializeElement(el, CONDITION_PROPS));
      }
    }

    // Tasks
    if (tasks.length > 0) {
      out.push('# --- Tasks ---');
      out.push('');
      for (const el of tasks) {
        out.push(serializeElement(el, TASK_PROPS));
      }
    }

    // Flows
    if (flows.length > 0) {
      out.push('# --- Flows ---');
      out.push('');
      for (const el of flows) {
        out.push(serializeElement(el, FLOW_PROPS));
      }
    }

    return out.join('\n');
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Sort key for conditions: input=0, output=1, intermediate=2
 */
function conditionOrder (el) {
  const t = ElementHelper.getConditionType(el);
  if (t === 'input') return 0;
  if (t === 'output') return 1;
  return 2;
}

/**
 * Serialize a single RDF individual (element) to TTL block
 */
function serializeElement (element, propertyList) {
  const lines = [];
  lines.push(formatUri(element.id));

  for (const prop of propertyList) {
    const values = element[prop];
    if (!values || values.length === 0) continue;

    const serialized = values
      .map((v) => serializeValue(v, prop))
      .filter((v) => v !== null);
    if (serialized.length === 0) continue;

    // Multi-line format for properties with many values
    if (MULTI_LINE_PROPS.has(prop) && serialized.length >= MULTI_LINE_THRESHOLD) {
      lines.push(`  ${prop}`);
      for (let i = 0; i < serialized.length; i++) {
        const separator = i < serialized.length - 1 ? ' ,' : ' ;';
        lines.push(`    ${serialized[i]}${separator}`);
      }
    } else if (serialized.length > 1) {
      // Inline multi-value (comma-separated)
      lines.push(`  ${prop} ${serialized.join(', ')} ;`);
    } else {
      lines.push(`  ${prop} ${serialized[0]} ;`);
    }
  }

  lines.push('.');
  lines.push('');
  return lines.join('\n');
}

/**
 * Serialize a single property value to its TTL representation
 */
function serializeValue (value, property) {
  if (value === null || value === undefined) return null;

  // URI reference (Model instance with .id)
  if (value && typeof value === 'object' && value.id) {
    return formatUri(value.id);
  }

  // veda-client backend object format: {data: "...", lang: "ru"} or {data: "...", type: "string"}
  // Unwrap to plain string and recurse so the string branch handles it normally.
  if (value && typeof value === 'object' && 'data' in value) {
    return serializeValue(String(value.data), property);
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Number
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  // String — may need coercion for known typed properties
  if (typeof value === 'string') {
    // Coerce to integer for known integer properties
    if (INTEGER_PROPS.has(property)) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return String(num);
    }

    // Coerce to boolean for known boolean properties
    if (BOOLEAN_PROPS.has(property)) {
      if (value === 'true' || value === true) return 'true';
      if (value === 'false' || value === false) return 'false';
    }

    // Strip veda-internal language tags (e.g. "Text^^EN")
    const clean = value.replace(/\^\^[A-Z]{2,}$/i, '');

    // Multi-line strings use triple quotes
    if (clean.includes('\n')) {
      return `"""${clean}"""`;
    }

    // Single-line string — escape backslashes and quotes
    const escaped = clean
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  return null;
}

/**
 * Format a URI for TTL output.
 * Prefixed names (e.g. "v-wf2:Net") are kept as-is.
 * Full HTTP URIs are wrapped in angle brackets.
 */
function formatUri (uri) {
  if (!uri) return '[]';
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return `<${uri}>`;
  }
  // Assume it is already a prefixed name (prefix:localName)
  return uri;
}

/**
 * Extract prefix part from a prefixed URI and add to the set
 */
function addPrefix (uri, prefixes) {
  if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) return;
  const idx = uri.indexOf(':');
  if (idx > 0) {
    prefixes.add(uri.substring(0, idx));
  }
}

/**
 * Walk an element's properties and collect all prefixes used
 */
function collectPrefixes (element, propertyList, prefixes) {
  for (const prop of propertyList) {
    addPrefix(prop, prefixes);
    const values = element[prop];
    if (!values) continue;
    for (const v of values) {
      if (v && typeof v === 'object' && v.id) {
        addPrefix(v.id, prefixes);
      }
    }
  }
}

/**
 * Make a safe filename from a label string
 */
function sanitizeFilename (name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Trigger browser file download
 */
function download (content, filename) {
  const blob = new Blob([content], { type: 'text/turtle;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
