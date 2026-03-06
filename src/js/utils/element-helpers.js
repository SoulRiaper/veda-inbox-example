/**
 * Helper functions for working with workflow elements
 */

import { PROPERTY_PATHS, TYPE_URIS, DEFAULTS } from './constants.js';
import { InvalidPositionError } from './errors.js';

/**
 * Strip language tag suffix (e.g. "Text^^EN" -> "Text")
 */
export function stripLang (str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/\^\^[A-Z]{2,}$/i, '');
}

export class ElementHelper {
  /**
   * Get element label (with language tag stripped).
   * Handles both string values and {data, type} objects from backend.
   */
  static getLabel(element) {
    const raw = element?.[PROPERTY_PATHS.LABEL]?.[0];
    const str = (typeof raw === 'object' && raw !== null && 'data' in raw)
      ? String(raw.data)
      : (raw || '');
    return stripLang(str);
  }

  /**
   * Get element position with error handling
   */
  static getPosition(element) {
    try {
      const pos = element?.[PROPERTY_PATHS.POSITION]?.[0];
      if (!pos) {
        return { ...DEFAULTS.POSITION };
      }
      
      const parsed = JSON.parse(pos);
      
      if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
        console.warn('Invalid position format:', pos);
        return { ...DEFAULTS.POSITION };
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse position:', error);
      return { ...DEFAULTS.POSITION };
    }
  }

  /**
   * Set element position
   */
  static setPosition(element, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new InvalidPositionError({ x, y });
    }
    element[PROPERTY_PATHS.POSITION] = [JSON.stringify({ x, y })];
  }

  /**
   * Check if element has specific type
   */
  static hasType(element, typeUri) {
    return element?.[PROPERTY_PATHS.TYPE]?.some(t => t.id === typeUri) || false;
  }

  /**
   * Check if element is a task
   */
  static isTask(element) {
    return this.hasType(element, TYPE_URIS.TASK);
  }

  /**
   * Check if element is a condition
   */
  static isCondition(element) {
    return this.hasType(element, TYPE_URIS.CONDITION);
  }

  /**
   * Check if element is a flow
   */
  static isFlow(element) {
    return this.hasType(element, TYPE_URIS.FLOW);
  }

  /**
   * Check if element is a net
   */
  static isNet(element) {
    return this.hasType(element, TYPE_URIS.NET);
  }

  /**
   * Get task type
   */
  static getTaskType(task) {
    const type = task?.[PROPERTY_PATHS.TASK_TYPE]?.[0]?.id;
    if (type === TYPE_URIS.MANUAL_TASK) return 'manual';
    if (type === TYPE_URIS.AUTOMATIC_TASK) return 'automatic';
    if (type === TYPE_URIS.SUBPROCESS_TASK) return 'subprocess';
    if (type === TYPE_URIS.EXTERNAL_TASK) return 'external';
    return 'manual'; // default
  }

  /**
   * Get condition type
   */
  static getConditionType(condition) {
    const type = condition?.[PROPERTY_PATHS.CONDITION_TYPE]?.[0]?.id;
    if (type === TYPE_URIS.INPUT_CONDITION) return 'input';
    if (type === TYPE_URIS.OUTPUT_CONDITION) return 'output';
    return 'intermediate';
  }

  /**
   * Get split type
   */
  static getSplitType(task) {
    const type = task?.[PROPERTY_PATHS.SPLIT_TYPE]?.[0]?.id;
    if (type === TYPE_URIS.AND_SPLIT) return 'and';
    if (type === TYPE_URIS.XOR_SPLIT) return 'xor';
    return null;
  }

  /**
   * Get join type
   */
  static getJoinType(task) {
    const type = task?.[PROPERTY_PATHS.JOIN_TYPE]?.[0]?.id;
    if (type === TYPE_URIS.AND_JOIN) return 'and';
    if (type === TYPE_URIS.XOR_JOIN) return 'xor';
    return null;
  }

  /**
   * Check if task has multi-instance flag
   */
  static isMultiInstance(task) {
    return task?.[PROPERTY_PATHS.MULTI_INSTANCE]?.[0] === true;
  }

  /**
   * Get route hint (array of perpendicular segment deltas) from a flow
   */
  static getRouteHint (flow) {
    try {
      const raw = flow?.[PROPERTY_PATHS.ROUTE_HINT]?.[0];
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Set route hint on a flow
   */
  static setRouteHint (flow, hint) {
    if (!hint || !Array.isArray(hint)) {
      delete flow[PROPERTY_PATHS.ROUTE_HINT];
      return;
    }
    flow[PROPERTY_PATHS.ROUTE_HINT] = [JSON.stringify(hint)];
  }

  /**
   * Get property value (first item from array)
   */
  static getValue(element, propertyPath) {
    return element?.[propertyPath]?.[0];
  }

  /**
   * Get property URI value
   */
  static getUriValue(element, propertyPath) {
    return element?.[propertyPath]?.[0]?.id || '';
  }

  /**
   * Check if element is input condition
   */
  static isInputCondition(element, net) {
    return net?.[PROPERTY_PATHS.INPUT_CONDITION]?.[0]?.id === element?.id;
  }

  /**
   * Check if element is output condition
   */
  static isOutputCondition(element, net) {
    return net?.[PROPERTY_PATHS.OUTPUT_CONDITION]?.[0]?.id === element?.id;
  }

  /**
   * Filter elements by type
   */
  static filterByType(elements, typeUri) {
    return elements.filter(el => this.hasType(el, typeUri));
  }

  /**
   * Get all tasks from elements
   */
  static getTasks(elements) {
    return this.filterByType(elements, TYPE_URIS.TASK);
  }

  /**
   * Get all conditions from elements
   */
  static getConditions(elements) {
    return this.filterByType(elements, TYPE_URIS.CONDITION);
  }

  /**
   * Get all flows from elements
   */
  static getFlows(elements) {
    return this.filterByType(elements, TYPE_URIS.FLOW);
  }
}
