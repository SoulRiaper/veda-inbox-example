/**
 * Validation utilities for workflow data
 */

import { ValidationError } from './errors.js';
import { VALIDATION_LIMITS } from './constants.js';

export class Validators {
  /**
   * Validate workflow net version
   */
  static validateNetVersion(version) {
    const parsed = parseInt(version);
    if (isNaN(parsed) || parsed < VALIDATION_LIMITS.MIN_VERSION || parsed > VALIDATION_LIMITS.MAX_VERSION) {
      throw new ValidationError(
        `Net version must be between ${VALIDATION_LIMITS.MIN_VERSION} and ${VALIDATION_LIMITS.MAX_VERSION}`
      );
    }
    return parsed;
  }

  /**
   * Validate label text
   */
  static validateLabel(label) {
    if (typeof label !== 'string') {
      throw new ValidationError('Label must be a string');
    }
    if (label.length > VALIDATION_LIMITS.MAX_LABEL_LENGTH) {
      throw new ValidationError(
        `Label must not exceed ${VALIDATION_LIMITS.MAX_LABEL_LENGTH} characters`
      );
    }
    return label;
  }

  /**
   * Validate comment text
   */
  static validateComment(comment) {
    if (comment && typeof comment !== 'string') {
      throw new ValidationError('Comment must be a string');
    }
    if (comment && comment.length > VALIDATION_LIMITS.MAX_COMMENT_LENGTH) {
      throw new ValidationError(
        `Comment must not exceed ${VALIDATION_LIMITS.MAX_COMMENT_LENGTH} characters`
      );
    }
    return comment;
  }

  /**
   * Validate ISO 8601 duration format
   */
  static validateTimeout(timeout) {
    if (!timeout) return timeout;
    
    // ISO 8601 duration pattern
    const iso8601Pattern = /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/;
    
    if (!iso8601Pattern.test(timeout)) {
      throw new ValidationError(
        'Timeout must be in ISO 8601 duration format (e.g., P3D, PT2H30M)'
      );
    }
    
    return timeout;
  }

  /**
   * Validate position object
   */
  static validatePosition(position) {
    if (!position || typeof position !== 'object') {
      throw new ValidationError('Position must be an object');
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new ValidationError('Position must have numeric x and y coordinates');
    }
    
    if (!isFinite(position.x) || !isFinite(position.y)) {
      throw new ValidationError('Position coordinates must be finite numbers');
    }
    
    return position;
  }

  /**
   * Validate priority value
   */
  static validatePriority(priority) {
    if (priority === null || priority === undefined || priority === '') {
      return null;
    }
    
    const parsed = parseInt(priority);
    if (isNaN(parsed)) {
      throw new ValidationError('Priority must be a number');
    }
    
    return parsed;
  }

  /**
   * Validate JavaScript expression (guard, onStart, onComplete)
   */
  static validateExpression(expr) {
    if (!expr) return expr;

    if (typeof expr !== 'string') {
      throw new ValidationError('Expression must be a string');
    }

    return expr;
  }

  /**
   * Validate URI format
   */
  static validateURI(uri) {
    if (!uri || typeof uri !== 'string') {
      throw new ValidationError('URI must be a non-empty string');
    }
    
    // Basic URI validation - should contain a colon
    if (!uri.includes(':')) {
      throw new ValidationError('Invalid URI format');
    }
    
    return uri;
  }
}
