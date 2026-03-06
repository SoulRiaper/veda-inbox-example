/**
 * Service layer for workflow operations
 */

import { Backend, Model, genUri } from 'veda-client';
import { WorkflowLoadError, WorkflowSaveError, ValidationError } from '../utils/errors.js';
import { PROPERTY_PATHS, TYPE_URIS, DEFAULTS, QUERY_LIMITS } from '../utils/constants.js';
import { Validators } from '../utils/validators.js';
import { workflowData } from './workflowData.js';

export class WorkflowService {
  /**
   * Load all workflow nets from backend (uses centralized workflowData store).
   */
  static async loadNets(limit = QUERY_LIMITS.DEFAULT_NETS_LIMIT) {
    try {
      return await workflowData.getNetsAsModels({ limit });
    } catch (error) {
      console.error('Failed to load nets:', error);
      throw new WorkflowLoadError('Failed to load workflow nets', { cause: error });
    }
  }

  /**
   * Load a single net with all its elements
   */
  static async loadNet(uri) {
    try {
      const net = new Model(uri);
      await net.load();
      net.subscribe();

      // Load all elements and subscribe for real-time updates
      const elements = net[PROPERTY_PATHS.CONSISTS_OF] || [];
      if (elements.length > 0) {
        await Promise.all(elements.map(async (el) => {
          await el.load();
          el.subscribe();
        }));
      }

      return net;
    } catch (error) {
      console.error('Failed to load net:', uri, error);
      throw new WorkflowLoadError(`Failed to load net: ${uri}`, { cause: error });
    }
  }

  /**
   * Create a new workflow net with input and output conditions
   */
  static async createNet(name = DEFAULTS.NEW_NET_NAME) {
    try {
      Validators.validateLabel(name);

      // Create net
      const net = new Model();
      net.id = genUri();
      net[PROPERTY_PATHS.TYPE] = [new Model(TYPE_URIS.NET)];
      net[PROPERTY_PATHS.LABEL] = [name];
      net[PROPERTY_PATHS.NET_VERSION] = [DEFAULTS.NET_VERSION];
      net[PROPERTY_PATHS.CONSISTS_OF] = [];

      // Create input condition
      const inputCondition = this.createCondition(
        DEFAULTS.START_CONDITION_NAME,
        TYPE_URIS.INPUT_CONDITION,
        net,
        DEFAULTS.START_POSITION
      );

      // Create output condition
      const outputCondition = this.createCondition(
        DEFAULTS.END_CONDITION_NAME,
        TYPE_URIS.OUTPUT_CONDITION,
        net,
        DEFAULTS.END_POSITION
      );

      net[PROPERTY_PATHS.INPUT_CONDITION] = [inputCondition];
      net[PROPERTY_PATHS.OUTPUT_CONDITION] = [outputCondition];
      net[PROPERTY_PATHS.CONSISTS_OF] = [inputCondition, outputCondition];

      await Promise.all([
        inputCondition.save(),
        outputCondition.save(),
        net.save(),
      ]);

      workflowData.invalidateNets();
      return net;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Failed to create net:', error);
      throw new WorkflowSaveError('Failed to create workflow net', { cause: error });
    }
  }

  /**
   * Create a condition element
   */
  static createCondition(label, conditionType, net, position = DEFAULTS.POSITION) {
    const condition = new Model();
    condition.id = genUri();
    condition[PROPERTY_PATHS.TYPE] = [new Model(TYPE_URIS.CONDITION)];
    condition[PROPERTY_PATHS.LABEL] = [label];
    condition[PROPERTY_PATHS.CONDITION_TYPE] = [new Model(conditionType)];
    condition[PROPERTY_PATHS.BELONGS_TO] = [net];
    condition[PROPERTY_PATHS.POSITION] = [JSON.stringify(position)];
    return condition;
  }

  /**
   * Create a task element
   */
  static createTask(label, net, position = DEFAULTS.POSITION) {
    const task = new Model();
    task.id = genUri();
    task[PROPERTY_PATHS.TYPE] = [new Model(TYPE_URIS.TASK)];
    task[PROPERTY_PATHS.LABEL] = [label];
    task[PROPERTY_PATHS.TASK_TYPE] = [new Model(TYPE_URIS.MANUAL_TASK)];
    task[PROPERTY_PATHS.BELONGS_TO] = [net];
    task[PROPERTY_PATHS.POSITION] = [JSON.stringify(position)];
    return task;
  }

  /**
   * Create a flow element
   */
  static createFlow(sourceElement, targetElement, net) {
    const flow = new Model();
    flow.id = genUri();
    flow[PROPERTY_PATHS.TYPE] = [new Model(TYPE_URIS.FLOW)];
    flow[PROPERTY_PATHS.FLOW_FROM] = [sourceElement];
    flow[PROPERTY_PATHS.FLOW_TO] = [targetElement];
    flow[PROPERTY_PATHS.BELONGS_TO] = [net];
    return flow;
  }

  /**
   * Delete a workflow net and all its elements
   */
  static async deleteNet(net) {
    try {
      const elements = net[PROPERTY_PATHS.CONSISTS_OF] || [];
      
      // Delete all elements
      for (const element of elements) {
        try {
          await element.remove();
        } catch (error) {
          console.error('Failed to delete element:', element.id, error);
        }
      }

      await net.remove();
      workflowData.invalidateNets();
      workflowData.invalidateProcesses();
    } catch (error) {
      console.error('Failed to delete net:', error);
      throw new WorkflowSaveError('Failed to delete workflow net', { cause: error });
    }
  }

  /**
   * Delete a single element from a net
   */
  static async deleteElement(element, net) {
    try {
      net.removeValue(PROPERTY_PATHS.CONSISTS_OF, element);
      await net.save();
      await element.remove();
    } catch (error) {
      console.error('Failed to delete element:', error);
      throw new WorkflowSaveError('Failed to delete element', { cause: error });
    }
  }

  /**
   * Save multiple elements in batch
   */
  static async saveElements(elements) {
    const errors = [];
    
    for (const element of elements) {
      try {
        await element.save();
      } catch (error) {
        console.error('Failed to save element:', element.id, error);
        errors.push({ element, error });
      }
    }

    if (errors.length > 0) {
      throw new WorkflowSaveError(
        `Failed to save ${errors.length} elements`,
        { context: { errors } }
      );
    }
  }
}
