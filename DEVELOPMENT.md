# Development Guide

This guide covers the development workflow, architecture, and best practices for the Veda Workflow Manager.

## Setup

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm run watch

# Production build
pnpm run build
```

## Configuration

### Auto-authentication for development

For development convenience, you can configure automatic authentication:

1. Copy `src/js/config/dev.config.js` to `src/js/config/dev.config.local.js`
2. Edit `dev.config.local.js` and set your credentials:

```javascript
export const devConfig = {
  autoAuth: {
    enabled: true,
    login: 'your-login',
    password: 'your-password'
  }
};
```

**Note**: `dev.config.local.js` is gitignored and will not be committed.

In production, users will see the login form and authenticate manually.

## Architecture

### Component Structure

```
src/js/
├── app/
│   ├── AppContainer.js          # Root component, manages auth state
│   ├── WorkflowManagerApp.js    # Main application: Designer/Processes tabs
│   └── routes.js                # Hash-based routing (designer/processes URL sync)
├── components/
│   ├── TopNav.js                # Top navigation: Designer / Processes tabs
│   ├── NetCanvas/               # Canvas sub-modules
│   │   ├── FlowPathCalculator.js   # SVG path calculation for flows
│   │   ├── FlowRenderer.js         # Flow rendering logic
│   │   ├── NodeRenderer.js         # Node rendering logic
│   │   ├── InteractionHandler.js   # Mouse/touch event handling (readonly support)
│   │   └── ExecutionOverlay.js     # Live process state overlay on canvas
│   ├── NetCanvas.js             # Main SVG canvas (orchestrates sub-modules)
│   ├── NetList.js               # Workflow list sidebar
│   ├── PropertyPanel.js         # Element property editor (scripts, decisions, etc.)
│   ├── MultiSelect.js           # Dropdown with search and chips (veda-client Component)
│   ├── ProcessList.js           # Process list (Designer tab, bottom)
│   ├── ProcessDetail.js         # Process detail (Designer tab, right)
│   ├── ProcessListPanel.js      # Process list (Processes tab, sidebar)
│   ├── ProcessDetailPanel.js    # Process detail (Processes tab, main)
│   ├── TraceViewer.js           # Execution trace viewer
│   ├── Toolbar.js               # Tool selection and actions
│   └── LoginForm.js             # Authentication form
├── services/
│   ├── WorkflowService.js       # Backend CRUD operations
│   ├── workflowData.js          # Centralized data store with cache and invalidation
│   └── TtlExporter.js           # Export workflow definitions to TTL
├── utils/
│   ├── constants.js             # Property paths, type URIs
│   ├── storedQuery.js           # ClickHouse stored query helpers (UI)
│   ├── element-helpers.js       # Element utility functions
│   ├── errors.js                # Custom error classes
│   └── validators.js            # Input validation functions
├── config/
│   └── dev.config.js            # Development config template
└── index.js                     # Entry point
```

### Component Communication

The application uses Web Components with a reactive architecture:

**Parent → Child**: Props binding
```javascript
<${PropertyPanel} :element="{this.state.selectedElement}" />
```

**Child → Parent**: Custom events
```javascript
this.dispatchEvent(new CustomEvent('element-select', {
  bubbles: true,
  detail: { element }
}));
```

**Reactive Updates**: Components automatically re-render when state changes via `effect()` and reactive getters.

### State Management

Each component manages its own state:

- **AppContainer**: Authentication state (`isAuthenticated`)
- **WorkflowManagerApp**: Global app state (selected net, element, tool, zoom, pan, active tab)
- **NetCanvas**: Local rendering state (initialized renderers, execution overlay)
- **PropertyPanel**: Task/flow properties (scripts via Synesthesia editor in modal, decisionClass via MultiSelect, inheritDocument, timeout, executor, etc.)
- **MultiSelect**: Internal state (open, filter, highlightIdx); receives items/value via props, emits change events
- **ProcessList/ProcessDetail**: Process monitoring state (selected process, WorkItem grids, admin actions)
- **Other components**: Mostly stateless, receive props and emit events

### Services Layer

**WorkflowService** abstracts all backend CRUD operations:
- `loadNets(limit)` - Load workflow list (uses workflowData store)
- `loadNet(uri)` - Load a single net with all its elements (load + subscribe)
- `createNet(name)` - Create new workflow with input/output conditions
- `createCondition(label, conditionType, net, position)` - Create a condition element
- `createTask(label, net, position)` - Create a task element
- `createFlow(sourceElement, targetElement, net)` - Create a flow element
- `saveElements(elements)` - Save multiple elements in batch
- `deleteNet(net)` - Delete workflow and all its elements
- `deleteElement(element, net)` - Delete a single element from a net

**workflowData** is a centralized data store with cache, invalidation, subscriptions, and auto-refresh:
- `getNets(opts)` / `getNetsAsModels(opts)` - Fetch net URI list / loaded Models
- `getProcesses(opts)` / `getProcessesAsModels(opts)` - Fetch process URI list / loaded Models
- `getProcessesByNet(netUri, opts)` / `getProcessesByNetAsModels(netUri, opts)` - Processes for one net
- `getDecisionClasses(opts)` - Fetch all `v-wf:Decision*` OWL subclasses (returns URI strings, pre-loads Models)
- `invalidateNets(opts)` / `invalidateProcesses(opts)` / `invalidateProcessesByNet(netUri)` / `invalidateDecisionClasses()` / `invalidateAll()` - Clear cache entries and notify subscribers
- `subscribe(key, callback)` / `unsubscribe(key, callback)` - Subscribe to cache invalidation events (debounced with ClickHouse sync delay)
- `startAutoRefresh(key, intervalMs)` / `stopAutoRefresh(key)` / `stopAllAutoRefresh()` - Periodic auto-refresh with ref-counting

**TtlExporter** exports workflow definitions to TTL format for ontology deployment:
- Serializes `v-wf2:decisionClass`, `v-wf2:inheritDocument`, scripts, and all Task/Flow properties

### Utilities

**constants.js**: All magic numbers and string literals
```javascript
import { NODE_DIMENSIONS, PROPERTY_PATHS, TYPE_URIS } from '../utils/constants.js';
```

**element-helpers.js**: Common element operations
```javascript
import { ElementHelper } from '../utils/element-helpers.js';
const position = ElementHelper.getPosition(element);
```

**validators.js**: Input validation
```javascript
import { Validators } from '../utils/validators.js';
Validators.validateNetVersion(version); // throws ValidationError if invalid
```

**errors.js**: Custom error classes
```javascript
import { ValidationError, WorkflowSaveError } from '../utils/errors.js';
```

## NetCanvas Architecture

`NetCanvas` is split into focused modules for better maintainability:

**NetCanvas.js** (main component):
- Manages state and props
- Orchestrates sub-modules
- Handles event dispatching
- Lazy initialization of renderers

**NodeRenderer.js**:
- Renders task and condition nodes
- Handles node styling and selection
- Creates SVG elements for nodes

**FlowRenderer.js**:
- Renders flow connections
- Groups and sorts flows for better visuals
- Handles flow hover effects

**FlowPathCalculator.js**:
- Calculates SVG path data
- Handles forward/backward flows
- Manages multiple flow offsets

**InteractionHandler.js**:
- Mouse and touch event handling
- Element dragging
- Canvas panning
- Flow creation
- Element selection

### Lazy Initialization

Renderers are initialized lazily inside the `effect()` to ensure DOM containers exist:

```javascript
this.effect(() => {
  // ...state tracking...
  
  requestAnimationFrame(() => {
    // Initialize renderers if not yet ready
    if (!this.nodeRenderer || !this.flowRenderer) {
      const nodesContainer = this.querySelector('.nodes-container');
      const flowsContainer = this.querySelector('.flows-container');
      
      if (nodesContainer && flowsContainer) {
        this.nodeRenderer = new NodeRenderer(nodesContainer);
        this.flowRenderer = new FlowRenderer(flowsContainer);
        this.interactionHandler = new InteractionHandler(this);
      } else {
        return; // Retry on next effect
      }
    }
    
    this.renderAll();
  });
});
```

This solves the timing issue where containers are conditionally rendered via `<${If}>` component.

## Code Style

### General
- Use named exports for utilities and services
- Use default exports for components
- Prefer `const` over `let`
- Use arrow functions for event handlers
- Add error handling to all async operations

### Element Operations
Always use helpers from `element-helpers.js`:
```javascript
// Good
const label = ElementHelper.getLabel(element);
ElementHelper.setPosition(element, x, y);

// Bad
const label = element['rdfs:label']?.[0]?.data || 'Untitled';
```

### Constants
Use constants instead of magic numbers:
```javascript
// Good
import { NODE_DIMENSIONS } from '../utils/constants.js';
const width = NODE_DIMENSIONS.TASK_WIDTH;

// Bad
const width = 120;
```

### Validation
Validate user input before processing:
```javascript
// Good
try {
  Validators.validateLabel(label);
  element['rdfs:label'] = [{ data: label, type: 'String' }];
} catch (error) {
  this.showError(error.message);
  return;
}

// Bad
element['rdfs:label'] = [{ data: label, type: 'String' }];
```

## Error Handling

Handle errors at the appropriate level:

**Validation errors**: Catch in event handlers, show user feedback
```javascript
try {
  Validators.validateNetVersion(version);
} catch (error) {
  if (error instanceof ValidationError) {
    this.showError(error.message);
    return;
  }
  throw error;
}
```

**Service errors**: Catch in component, show notification
```javascript
try {
  await WorkflowService.createNet(name);
} catch (error) {
  if (error instanceof WorkflowSaveError) {
    this.showError('Failed to create workflow');
  } else {
    this.showError('Unexpected error occurred');
    console.error(error);
  }
}
```

**Unexpected errors**: Log to console with context
```javascript
try {
  // risky operation
} catch (error) {
  console.error('Failed to process element:', element, error);
  this.showError('An unexpected error occurred');
}
```

## Testing

### Manual Testing Checklist

**Authentication**:
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Session persistence works (refresh page)
- [ ] Auto-auth in dev mode works

**Workflow List**:
- [ ] Workflows load and display
- [ ] Create new workflow works
- [ ] Select workflow loads it in canvas
- [ ] Delete workflow works

**Canvas**:
- [ ] Selected workflow displays correctly
- [ ] Tasks render with correct type icons
- [ ] Conditions render as diamonds
- [ ] Flows render as curved lines
- [ ] Selection highlights work

**Tools**:
- [ ] Select tool works (default)
- [ ] Task tool creates tasks on click
- [ ] Condition tool creates conditions on click
- [ ] Flow tool creates flows between elements
- [ ] Pan tool allows canvas panning

**Interactions**:
- [ ] Drag elements to move them
- [ ] Click elements to select them
- [ ] Mouse wheel zooms in/out
- [ ] Touch pinch zooms (mobile/tablet)
- [ ] Touch drag moves elements
- [ ] Two-finger drag pans canvas

**Properties**:
- [ ] Selected element properties display
- [ ] Edit element label
- [ ] Change task type (Manual/Automatic/Subprocess/External)
- [ ] Change split/join types (AND/XOR)
- [ ] Edit onStart/onComplete scripts via modal editor (Synesthesia)
- [ ] Select decision classes via MultiSelect (search, chips, dropdown)
- [ ] Toggle inheritDocument for SubprocessTask
- [ ] Configure timeout, escalateTo, multi-instance
- [ ] Save button persists changes

**Keyboard Shortcuts**:
- [ ] V/Esc switches to select tool
- [ ] T switches to task tool
- [ ] C switches to condition tool
- [ ] F switches to flow tool
- [ ] Delete removes selected element
- [ ] Ctrl+S saves changes
- [ ] Ctrl+0 resets zoom/pan

## Future Improvements

### High Priority
- [ ] Add user-friendly error notifications (toast/snackbar)
- [ ] Add undo/redo functionality
- [ ] Add copy/paste for elements
- [ ] Add element alignment tools
- [ ] Add canvas minimap for navigation

### Medium Priority
- [ ] Add JSDoc documentation
- [ ] Add unit tests for utilities
- [ ] Add integration tests for components
- [ ] Improve mobile/tablet experience
- [ ] Add keyboard navigation
- [ ] Add ARIA labels for accessibility

### Low Priority
- [ ] Add export to PNG/SVG
- [ ] Add workflow templates
- [ ] Add collaborative editing
- [ ] Add version history
- [ ] Add performance monitoring

## Contributing

1. Create a feature branch from `master`
2. Make your changes following the code style guide
3. Test thoroughly using the manual testing checklist
4. Update documentation if needed
5. Commit with a clear message describing what and why
6. Push and create a pull request

## Debugging Tips

### Canvas not rendering
Check browser console for:
- "Containers not ready yet" - renderers not initialized
- "Container not found" - DOM elements missing
- Check that selected net has elements

### Elements not saving
Check network tab for failed requests to backend. Check that:
- User is authenticated (`Backend.ticket` exists)
- Element has valid properties
- Backend is running and accessible

### Performance issues
Use browser DevTools Performance tab to identify bottlenecks:
- Excessive re-renders? Check `effect()` dependencies
- Slow rendering? Profile `renderNodes()` and `renderFlows()`
- Memory leaks? Check event listener cleanup in `disconnectedCallback()`
