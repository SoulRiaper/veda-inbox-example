import './setup-dom.js';
import { ElementHelper } from '../src/js/utils/element-helpers.js';
import { createMockElement } from './helpers.js';

export default ({ test, assert }) => {

  // ==================== getLabel ====================

  test('ElementHelper - getLabel returns label', () => {
    const element = createMockElement('task', { label: 'My Task' });
    const label = ElementHelper.getLabel(element);
    assert(label === 'My Task', `Expected 'My Task', got '${label}'`);
  });

  test('ElementHelper - getLabel returns empty string for missing label', () => {
    const element = { id: 'd:test', '@': 'd:test' };
    assert(ElementHelper.getLabel(element) === '');
  });

  test('ElementHelper - getLabel handles {data, type} format from backend', () => {
    const element = { id: 'd:test', 'rdfs:label': [{ data: 'Start', type: 'String' }] };
    const label = ElementHelper.getLabel(element);
    assert(label === 'Start', `Expected 'Start', got '${label}'`);
  });

  // ==================== getPosition ====================

  test('ElementHelper - getPosition returns coordinates', () => {
    const element = createMockElement('task', { position: { x: 100, y: 200 } });
    const pos = ElementHelper.getPosition(element);
    assert(pos.x === 100 && pos.y === 200, `Expected {x:100,y:200}, got {x:${pos.x},y:${pos.y}}`);
  });

  test('ElementHelper - getPosition returns default for missing position', () => {
    const element = { id: 'd:test', '@': 'd:test' };
    const pos = ElementHelper.getPosition(element);
    assert(pos.x === 0 && pos.y === 0, `Expected default {x:0,y:0}, got {x:${pos.x},y:${pos.y}}`);
  });

  // ==================== setPosition ====================

  test('ElementHelper - setPosition updates coordinates', () => {
    const element = createMockElement('task');
    ElementHelper.setPosition(element, 150, 250);
    const pos = ElementHelper.getPosition(element);
    assert(pos.x === 150 && pos.y === 250, `Expected {x:150,y:250}, got {x:${pos.x},y:${pos.y}}`);
  });

  // ==================== Type checks ====================

  test('ElementHelper - isTask identifies tasks', () => {
    const task = createMockElement('task');
    const condition = createMockElement('condition');
    assert(ElementHelper.isTask(task) === true, 'Task should be identified as task');
    assert(ElementHelper.isTask(condition) === false, 'Condition should not be task');
  });

  test('ElementHelper - isCondition identifies conditions', () => {
    const task = createMockElement('task');
    const condition = createMockElement('condition');
    assert(ElementHelper.isCondition(condition) === true, 'Condition should be identified');
    assert(ElementHelper.isCondition(task) === false, 'Task should not be condition');
  });

  test('ElementHelper - isFlow identifies flows', () => {
    const flow = createMockElement('flow');
    const task = createMockElement('task');
    assert(ElementHelper.isFlow(flow) === true, 'Flow should be identified');
    assert(ElementHelper.isFlow(task) === false, 'Task should not be flow');
  });

  // ==================== getTaskType ====================

  test('ElementHelper - getTaskType returns task type', () => {
    const element = createMockElement('task', { taskType: 'v-wf2:AutomaticTask' });
    assert(ElementHelper.getTaskType(element) === 'automatic');
  });

  test('ElementHelper - getTaskType returns default for missing type', () => {
    const element = createMockElement('task');
    // Remove taskType
    delete element['v-wf2:taskType'];
    assert(ElementHelper.getTaskType(element) === 'manual', 'Should default to manual');
  });

  // ==================== getConditionType ====================

  test('ElementHelper - getConditionType returns condition type', () => {
    const element = createMockElement('condition', { conditionType: 'v-wf2:OutputConditionType' });
    assert(ElementHelper.getConditionType(element) === 'output');
  });

  // ==================== Filtering ====================

  test('ElementHelper - getTasks extracts only tasks', () => {
    const elements = [
      createMockElement('task', { id: 'd:task1' }),
      createMockElement('condition', { id: 'd:cond1' }),
      createMockElement('task', { id: 'd:task2' }),
      createMockElement('flow', { id: 'd:flow1' })
    ];
    const tasks = ElementHelper.getTasks(elements);
    assert(tasks.length === 2, `Expected 2 tasks, got ${tasks.length}`);
    assert(tasks.every(t => ElementHelper.isTask(t)), 'All should be tasks');
  });

  test('ElementHelper - getConditions extracts only conditions', () => {
    const elements = [
      createMockElement('task', { id: 'd:task1' }),
      createMockElement('condition', { id: 'd:cond1' }),
      createMockElement('condition', { id: 'd:cond2' }),
      createMockElement('flow', { id: 'd:flow1' })
    ];
    const conditions = ElementHelper.getConditions(elements);
    assert(conditions.length === 2, `Expected 2 conditions, got ${conditions.length}`);
    assert(conditions.every(c => ElementHelper.isCondition(c)), 'All should be conditions');
  });

  test('ElementHelper - getFlows extracts only flows', () => {
    const elements = [
      createMockElement('task', { id: 'd:task1' }),
      createMockElement('flow', { id: 'd:flow1' }),
      createMockElement('condition', { id: 'd:cond1' }),
      createMockElement('flow', { id: 'd:flow2' })
    ];
    const flows = ElementHelper.getFlows(elements);
    assert(flows.length === 2, `Expected 2 flows, got ${flows.length}`);
    assert(flows.every(f => ElementHelper.isFlow(f)), 'All should be flows');
  });

  // ==================== hasType ====================

  test('ElementHelper - hasType checks for type URI', () => {
    const element = createMockElement('task');
    assert(ElementHelper.hasType(element, 'v-wf2:Task') === true);
    assert(ElementHelper.hasType(element, 'v-wf2:Condition') === false);
  });

  // ==================== Edge cases ====================

  test('ElementHelper - handles null/undefined gracefully', () => {
    assert(ElementHelper.getLabel(null) === '');
    assert(ElementHelper.getLabel(undefined) === '');
    assert(ElementHelper.isTask(null) === false);
    assert(ElementHelper.isCondition(undefined) === false);
  });

};
