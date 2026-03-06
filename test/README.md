# Test Suite

## 📁 Directory Structure

```
test/
├── *.test.js           # Unit tests (fast, isolated)
├── helpers.js          # Test utilities
├── setup-dom.js        # DOM environment setup
├── index.js            # Test runner
└── README.md           # This file
```

## 🚀 Running Tests

```bash
# Run all tests
pnpm test

# Run only unit tests (fast)
pnpm test:unit

# Run only integration tests (requires server)
pnpm test:integration
```

## 🎯 Test Categories

### Unit Tests
- **Location**: `test/*.test.js`
- **Speed**: Fast (< 5 seconds)
- **Dependencies**: None (no server required)
- **Purpose**: Test individual utilities and components in isolation
- **Examples**:
  - `validators.test.js` - Input validation
  - `element-helpers.test.js` - Element utility functions
  - `constants.test.js` - Constants validation

### Integration Tests (planned)
- **Location**: `test/integration/*.test.js` (not yet created)
- **Speed**: Slower (requires real backend)
- **Dependencies**: Running Veda server
- **Purpose**: Test real interactions with backend

## 🛠 Writing Tests

### Unit Test Example

```javascript
import { generateTestId, createMockElement } from './helpers.js';

export default ({ test, assert }) => {
  test('ElementHelper - getLabel', () => {
    const element = createMockElement('task', { label: 'My Task' });
    const label = ElementHelper.getLabel(element);
    assert(label === 'My Task', 'Should extract label correctly');
  });
};
```

### Component Test Example

```javascript
import { createTestComponent, waitForCondition } from './helpers.js';
import NetCanvas from '../src/js/components/NetCanvas.js';

export default ({ test, assert }) => {
  test('NetCanvas - renders nodes', async () => {
    const { component, cleanup } = await createTestComponent(NetCanvas, {
      setup: (comp) => {
        comp.state.net = createMockNet();
      }
    });

    await waitForCondition(
      () => component.querySelectorAll('.node').length > 0,
      { message: 'Should render nodes' }
    );

    assert(component.querySelector('.node'), 'Node should be rendered');
    cleanup();
  });
};
```

## 📊 Test Utilities

### helpers.js

- `createTestComponent(Class, options)` - Create component with cleanup
- `waitForCondition(fn, options)` - Smart async waiting
- `waitForValue(getter, expected)` - Wait for specific value
- `createSpy()` - Function call tracking
- `captureConsole(fn, method)` - Capture console output
- `createMockElement(type, props)` - Create mock workflow element
- `createMockNet(options)` - Create mock workflow net
- `generateTestId(prefix)` - Unique test IDs
- `retry(operation, options)` - Retry with backoff

## 🎨 Test Naming Convention

- Unit tests: `ComponentName.test.js` or `utility-name.test.js`
- Integration tests: `ComponentName.integration.test.js`
- Test names: Descriptive, indicate what is being tested

Format: `"ComponentName/utility - description of what is tested"`

## ⚡ Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always cleanup DOM elements and event listeners
3. **Async**: Use `async/await` for all async operations
4. **Descriptive**: Test names should clearly describe what is tested
5. **Fast**: Unit tests should run in < 5 seconds total
6. **Focused**: Test one thing per test case

## 🔧 Development Workflow

```bash
# During development (fast feedback)
pnpm test:unit

# Before commit (full validation)
pnpm test

# Watch mode (future)
pnpm test:watch
```
