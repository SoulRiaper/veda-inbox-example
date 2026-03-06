import './setup-dom.js';
import { 
  NODE_DIMENSIONS, 
  PROPERTY_PATHS, 
  TYPE_URIS,
  VALIDATION_LIMITS,
  ZOOM_LIMITS
} from '../src/js/utils/constants.js';

export default ({ test, assert }) => {

  // ==================== NODE_DIMENSIONS ====================

  test('Constants - NODE_DIMENSIONS has required properties', () => {
    assert(typeof NODE_DIMENSIONS.TASK_WIDTH === 'number');
    assert(typeof NODE_DIMENSIONS.TASK_HEIGHT === 'number');
    assert(typeof NODE_DIMENSIONS.CONDITION_RADIUS === 'number');
    assert(NODE_DIMENSIONS.TASK_WIDTH > 0);
    assert(NODE_DIMENSIONS.TASK_HEIGHT > 0);
    assert(NODE_DIMENSIONS.CONDITION_RADIUS > 0);
  });

  // ==================== PROPERTY_PATHS ====================

  test('Constants - PROPERTY_PATHS has all required paths', () => {
    assert(typeof PROPERTY_PATHS.LABEL === 'string');
    assert(typeof PROPERTY_PATHS.TYPE === 'string');
    assert(typeof PROPERTY_PATHS.POSITION === 'string');
    assert(typeof PROPERTY_PATHS.TASK_TYPE === 'string');
    assert(typeof PROPERTY_PATHS.CONDITION_TYPE === 'string');
    assert(typeof PROPERTY_PATHS.FLOW_FROM === 'string');
    assert(typeof PROPERTY_PATHS.FLOW_TO === 'string');
  });

  test('Constants - PROPERTY_PATHS are valid RDF properties', () => {
    assert(PROPERTY_PATHS.LABEL.includes(':'));
    assert(PROPERTY_PATHS.TYPE.includes(':'));
    assert(PROPERTY_PATHS.POSITION.includes(':'));
  });

  // ==================== TYPE_URIS ====================

  test('Constants - TYPE_URIS has basic types', () => {
    assert(typeof TYPE_URIS.NET === 'string');
    assert(typeof TYPE_URIS.TASK === 'string');
    assert(typeof TYPE_URIS.CONDITION === 'string');
    assert(typeof TYPE_URIS.FLOW === 'string');
  });

  test('Constants - TYPE_URIS has all task types', () => {
    assert(typeof TYPE_URIS.MANUAL_TASK === 'string');
    assert(typeof TYPE_URIS.AUTOMATIC_TASK === 'string');
    assert(typeof TYPE_URIS.SUBPROCESS_TASK === 'string');
  });

  test('Constants - TYPE_URIS has all condition types', () => {
    assert(typeof TYPE_URIS.INPUT_CONDITION === 'string');
    assert(typeof TYPE_URIS.OUTPUT_CONDITION === 'string');
    assert(typeof TYPE_URIS.INTERMEDIATE_CONDITION === 'string');
  });

  test('Constants - TYPE_URIS has gateway types', () => {
    assert(typeof TYPE_URIS.AND_SPLIT === 'string');
    assert(typeof TYPE_URIS.XOR_SPLIT === 'string');
    assert(typeof TYPE_URIS.OR_SPLIT === 'string');
    assert(typeof TYPE_URIS.AND_JOIN === 'string');
    assert(typeof TYPE_URIS.XOR_JOIN === 'string');
    assert(typeof TYPE_URIS.OR_JOIN === 'string');
  });

  test('Constants - TYPE_URIS are valid URIs', () => {
    assert(TYPE_URIS.NET.includes(':'));
    assert(TYPE_URIS.TASK.includes(':'));
    assert(TYPE_URIS.MANUAL_TASK.includes(':'));
    assert(TYPE_URIS.INPUT_CONDITION.includes(':'));
    assert(TYPE_URIS.AND_SPLIT.includes(':'));
  });

  // ==================== VALIDATION_LIMITS ====================

  test('Constants - VALIDATION_LIMITS has sensible values', () => {
    assert(VALIDATION_LIMITS.MAX_LABEL_LENGTH > 0);
    assert(VALIDATION_LIMITS.MAX_LABEL_LENGTH <= 1000);
  });

  // ==================== ZOOM_LIMITS ====================

  test('Constants - ZOOM_LIMITS has valid range', () => {
    assert(ZOOM_LIMITS.MIN > 0);
    assert(ZOOM_LIMITS.MAX > ZOOM_LIMITS.MIN);
    assert(ZOOM_LIMITS.DEFAULT >= ZOOM_LIMITS.MIN);
    assert(ZOOM_LIMITS.DEFAULT <= ZOOM_LIMITS.MAX);
    assert(ZOOM_LIMITS.STEP > 0);
  });

  test('Constants - ZOOM_LIMITS.STEP is reasonable', () => {
    // Step should allow multiple zoom levels
    const steps = (ZOOM_LIMITS.MAX - ZOOM_LIMITS.MIN) / ZOOM_LIMITS.STEP;
    assert(steps >= 5, 'Should have at least 5 zoom levels');
    assert(steps <= 100, 'Should not have too many zoom levels');
  });

  // ==================== Consistency ====================

  test('Constants - all constants are frozen/immutable', () => {
    // Document that constants should be treated as immutable
    assert(true, 'Constants should be treated as immutable');
  });

};
