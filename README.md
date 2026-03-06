# Veda Workflow Manager

Visual workflow manager for Veda platform. A modern, interactive tool for creating, editing, and monitoring workflow nets. Consists of two tabs: **Designer** (net editing) and **Processes** (cross-net process management).

## Features

- **Visual Workflow Editor**: Drag-and-drop interface for creating workflow diagrams
- **BPMN-inspired Elements**: Tasks (Manual, Automatic, Subprocess, External), Conditions, and Flows with gateway patterns (AND, XOR)
- **Process Monitoring**: Real-time process state overlay on canvas, WorkItem grids, admin actions
- **Execution Trace**: Opt-in trace viewer for debugging process execution
- **Real-time Collaboration**: Direct integration with Veda backend
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Touch Support**: Full support for touch gestures including pinch-to-zoom
- **Dark/Light Themes**: Switch between dark and light color schemes
- **Keyboard Shortcuts**: Efficient workflow editing with keyboard shortcuts

## Technology Stack

- **Framework**: Web Components with [veda-client](https://github.com/semantic-machines/veda-client)
- **Build Tool**: esbuild
- **Language**: Modern JavaScript (ES2022+)
- **Styling**: Pure CSS with CSS Variables for theming

## Installation

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm run watch

# Production build
pnpm run build
```

## Configuration

For development, you can create `src/js/config/dev.config.local.js` (gitignored) to configure auto-authentication:

```javascript
export const devConfig = {
  autoAuth: {
    enabled: true,
    login: 'your-login',
    password: 'your-password'
  }
};
```

In production, users will see a login form to authenticate with the Veda backend.

## Usage

### Keyboard Shortcuts

- `V` or `Esc` - Select tool
- `T` - Add Task
- `C` - Add Condition
- `F` - Add Flow
- `Space` (hold) - Temporary pan mode
- `Delete` / `Backspace` - Delete selected element
- `Ctrl/Cmd + Plus` - Zoom in
- `Ctrl/Cmd + Minus` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom and pan
- `Ctrl/Cmd + S` - Save changes

### Workflow Elements

**Tasks**
- Manual Task: Human-performed activities (with assignee, decisionClass, takenDecision)
- Automatic Task: System-performed activities (sync or async)
- Subprocess Task: Nested workflow execution (with inheritDocument)
- External Task: Handled by external modules via handler + topic

**Conditions**
- Input Condition: Workflow start point
- Output Condition: Workflow end point
- Intermediate Condition: Synchronization points

**Gateways**
- AND-split/join: Parallel execution paths
- XOR-split/join: Exclusive choice

## Architecture

```
src/
├── js/
│   ├── app/
│   │   ├── AppContainer.js          # Root component with auth
│   │   ├── WorkflowManagerApp.js    # Main application: Designer/Processes tabs
│   │   └── routes.js                # Hash-based routing (URL ↔ app state sync)
│   ├── components/
│   │   ├── TopNav.js                # Top navigation: Designer / Processes tabs
│   │   ├── NetCanvas/               # Canvas sub-modules
│   │   │   ├── FlowPathCalculator.js  # SVG path calculation
│   │   │   ├── FlowRenderer.js        # Flow rendering
│   │   │   ├── NodeRenderer.js        # Node rendering
│   │   │   ├── InteractionHandler.js  # Mouse/touch handling (readonly support)
│   │   │   └── ExecutionOverlay.js    # Live process state overlay on canvas
│   │   ├── NetCanvas.js             # SVG canvas (uses sub-modules)
│   │   ├── NetList.js               # Sidebar with workflow list
│   │   ├── PropertyPanel.js         # Element property editor (scripts, decisions, etc.)
│   │   ├── MultiSelect.js           # Dropdown with search and chips (veda-client Component)
│   │   ├── ProcessList.js           # Process list (Designer tab, bottom)
│   │   ├── ProcessDetail.js         # Process detail (Designer tab, right)
│   │   ├── ProcessListPanel.js      # Process list (Processes tab, sidebar)
│   │   ├── ProcessDetailPanel.js    # Process detail (Processes tab, main)
│   │   ├── TraceViewer.js           # Execution trace viewer
│   │   ├── Toolbar.js               # Tool selection and actions
│   │   └── LoginForm.js             # Authentication form
│   ├── services/
│   │   ├── WorkflowService.js       # Backend CRUD operations
│   │   ├── workflowData.js          # Centralized data store with cache and invalidation
│   │   └── TtlExporter.js           # Export workflow definitions to TTL
│   ├── utils/
│   │   ├── constants.js             # Property paths, type URIs
│   │   ├── storedQuery.js           # ClickHouse stored query helpers (UI)
│   │   ├── element-helpers.js       # Element utility functions
│   │   ├── errors.js                # Custom error classes
│   │   └── validators.js            # Input validation
│   ├── config/
│   │   └── dev.config.js            # Development configuration
│   └── index.js                     # Entry point
├── css/
│   ├── main.css                     # Global styles with theming
│   ├── login.css                    # Login form styles
│   └── loading.css                  # Loading spinner styles
└── index.html                       # HTML template
```

## Development

The application uses a reactive component architecture based on Web Components. Each component manages its own state and communicates through custom events.

### Component Communication

- Parent-to-child: Props binding (`:prop="{value}"`)
- Child-to-parent: Custom events with `bubbles: true`
- Reactive updates: Automatic re-rendering on state changes

### Code Organization

- **Services Layer**: Backend operations (`WorkflowService`), centralized data store (`workflowData`), TTL export (`TtlExporter`)
- **Utilities**: Reusable helpers, validators, constants, stored queries
- **Components**: UI components with separated concerns (extends `veda-client` Component for complex widgets like MultiSelect)
- **Error Handling**: Custom error classes with context

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
