/**
 * Custom error classes for workflow operations
 */

export class WorkflowError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = options.context;
    this.cause = options.cause;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class WorkflowLoadError extends WorkflowError {
  constructor(message, options = {}) {
    super(message || 'Failed to load workflow', options);
  }
}

export class WorkflowSaveError extends WorkflowError {
  constructor(message, options = {}) {
    super(message || 'Failed to save workflow', options);
  }
}

export class ValidationError extends WorkflowError {
  constructor(message, options = {}) {
    super(message || 'Validation failed', options);
  }
}

export class ElementNotFoundError extends WorkflowError {
  constructor(elementId, options = {}) {
    super(`Element not found: ${elementId}`, options);
    this.elementId = elementId;
  }
}

export class InvalidPositionError extends ValidationError {
  constructor(position, options = {}) {
    super(`Invalid position: ${JSON.stringify(position)}`, options);
    this.position = position;
  }
}

export class InvalidTypeError extends ValidationError {
  constructor(expectedType, actualType, options = {}) {
    super(`Invalid type: expected ${expectedType}, got ${actualType}`, options);
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}
