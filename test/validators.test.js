import './setup-dom.js';
import { Validators } from '../src/js/utils/validators.js';
import { ValidationError } from '../src/js/utils/errors.js';

export default ({ test, assert }) => {

  // ==================== validateNetVersion ====================

  test('Validators - validateNetVersion accepts valid versions', () => {
    assert.doesNotThrow(() => Validators.validateNetVersion('1'));
    assert.doesNotThrow(() => Validators.validateNetVersion('10'));
    assert.doesNotThrow(() => Validators.validateNetVersion('999'));
  });

  test('Validators - validateNetVersion rejects invalid versions', () => {
    assert.throws(() => Validators.validateNetVersion('0'), ValidationError);
    assert.throws(() => Validators.validateNetVersion('1001'), ValidationError);
    assert.throws(() => Validators.validateNetVersion('abc'), ValidationError);
  });

  // ==================== validateLabel ====================

  test('Validators - validateLabel accepts valid labels', () => {
    assert.doesNotThrow(() => Validators.validateLabel('Task'));
    assert.doesNotThrow(() => Validators.validateLabel('A'));
    assert.doesNotThrow(() => Validators.validateLabel('x'.repeat(200)));
  });

  test('Validators - validateLabel rejects too long labels', () => {
    assert.throws(() => Validators.validateLabel('x'.repeat(201)), ValidationError);
  });

  test('Validators - validateLabel allows empty string', () => {
    assert.doesNotThrow(() => Validators.validateLabel(''));
  });

  // ==================== validateTimeout ====================

  test('Validators - validateTimeout accepts valid ISO 8601 durations', () => {
    assert.doesNotThrow(() => Validators.validateTimeout('P1D'));
    assert.doesNotThrow(() => Validators.validateTimeout('PT1H'));
    assert.doesNotThrow(() => Validators.validateTimeout('PT30M'));
    assert.doesNotThrow(() => Validators.validateTimeout('PT1H30M'));
    assert.doesNotThrow(() => Validators.validateTimeout('P1DT2H30M'));
  });

  test('Validators - validateTimeout rejects invalid formats', () => {
    assert.throws(() => Validators.validateTimeout('1 hour'), ValidationError);
    assert.throws(() => Validators.validateTimeout('60'), ValidationError);
    assert.throws(() => Validators.validateTimeout('abc'), ValidationError);
  });

  test('Validators - validateTimeout accepts empty string', () => {
    assert.doesNotThrow(() => Validators.validateTimeout(''));
  });

  // ==================== validateJSONPath ====================

  test('Validators - validateJSONPath accepts valid paths', () => {
    assert.doesNotThrow(() => Validators.validateJSONPath('$.data'));
    assert.doesNotThrow(() => Validators.validateJSONPath('$.user.name'));
    assert.doesNotThrow(() => Validators.validateJSONPath('$[0]'));
    assert.doesNotThrow(() => Validators.validateJSONPath('$.items[*].name'));
  });

  test('Validators - validateJSONPath rejects invalid paths', () => {
    assert.throws(() => Validators.validateJSONPath('data'), ValidationError);
    assert.throws(() => Validators.validateJSONPath('.user'), ValidationError);
  });

  test('Validators - validateJSONPath accepts empty string', () => {
    assert.doesNotThrow(() => Validators.validateJSONPath(''));
  });

  // ==================== validateYAML ====================

  test('Validators - validateYAML accepts any string', () => {
    assert.doesNotThrow(() => Validators.validateYAML('key: value'));
    assert.doesNotThrow(() => Validators.validateYAML('- item1\n- item2'));
    assert.doesNotThrow(() => Validators.validateYAML('{}'));
    assert.doesNotThrow(() => Validators.validateYAML(''));
  });

  // ==================== validateURI ====================

  test('Validators - validateURI accepts valid URIs', () => {
    assert.doesNotThrow(() => Validators.validateURI('d:task_123'));
    assert.doesNotThrow(() => Validators.validateURI('v-wf2:Task'));
    assert.doesNotThrow(() => Validators.validateURI('http://example.com'));
  });

  test('Validators - validateURI rejects invalid URIs', () => {
    assert.throws(() => Validators.validateURI(''), ValidationError);
    assert.throws(() => Validators.validateURI('   '), ValidationError);
    assert.throws(() => Validators.validateURI('not a uri'), ValidationError);
  });

  // ==================== validatePosition ====================

  test('Validators - validatePosition accepts valid positions', () => {
    assert.doesNotThrow(() => Validators.validatePosition({ x: 0, y: 0 }));
    assert.doesNotThrow(() => Validators.validatePosition({ x: 100, y: 200 }));
    assert.doesNotThrow(() => Validators.validatePosition({ x: -50, y: -100 }));
  });

  test('Validators - validatePosition rejects invalid positions', () => {
    assert.throws(() => Validators.validatePosition(null), ValidationError);
    assert.throws(() => Validators.validatePosition({}), ValidationError);
    assert.throws(() => Validators.validatePosition({ x: 'a', y: 0 }), ValidationError);
    assert.throws(() => Validators.validatePosition({ x: 0, y: Infinity }), ValidationError);
  });

  // ==================== validatePriority ====================

  test('Validators - validatePriority accepts valid priorities', () => {
    assert(Validators.validatePriority(0) === 0);
    assert(Validators.validatePriority(10) === 10);
    assert(Validators.validatePriority(-5) === -5);
  });

  test('Validators - validatePriority returns null for empty values', () => {
    assert(Validators.validatePriority(null) === null);
    assert(Validators.validatePriority(undefined) === null);
    assert(Validators.validatePriority('') === null);
  });

  test('Validators - validatePriority rejects non-numeric values', () => {
    assert.throws(() => Validators.validatePriority('abc'), ValidationError);
  });

  // ==================== Error Messages ====================

  test('Validators - error messages are descriptive', () => {
    try {
      Validators.validateLabel('x'.repeat(201));
      assert(false, 'Should have thrown');
    } catch (error) {
      assert(error instanceof ValidationError, 'Should be ValidationError');
      assert(error.message.includes('200'), `Should mention max length, got: ${error.message}`);
    }
  });

};
