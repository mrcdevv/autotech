# Frontend - AI Agent Guidelines

## Overview

This is the frontend of Autotech, a mechanical workshop management system built with React 19, TypeScript, and Material UI v6.

## Rule-Selection Guide (Token Optimization)

**Read ONLY the files relevant to your current task.** Always read `general.md` first (it's short), then pick from the table:

| Task | Read these files |
|---|---|
| Creating/modifying a component | `component-rules.md` |
| TypeScript types, interfaces, imports | `typescript-rules.md` |
| Styling, layout, theme usage | `styling-rules.md` |
| API calls, state management, routing | `api-and-state-rules.md` |
| Writing tests | `testing-rules.md` |
| Full feature (component + API + types) | `component-rules.md`, `typescript-rules.md`, `api-and-state-rules.md` |

## Language Convention

- **Code in English**: component names, function names, variables, type definitions, comments, and all source code.
- **User-facing text in Spanish (Latin American)**: all UI labels, button text, form placeholders, error messages, notifications, tooltips, page titles, and any text visible to the end user. This software targets a Latin American audience.

## MCP Server

The MUI MCP server is configured in `.vscode/mcp.json` at the project root. It provides AI assistants with access to MUI component documentation, props, and code examples. Always consult it when using MUI components.

## Architecture

Feature-based folder structure under `src/`:

| Folder | Purpose |
|---|---|
| `api/` | Axios instance and API endpoint functions |
| `components/` | Shared/reusable UI components |
| `features/` | Feature modules (employees, clients, vehicles, etc.) |
| `hooks/` | Shared custom React hooks |
| `layouts/` | Page layouts (sidebar, header) |
| `pages/` | Route-level page components |
| `routes/` | Route definitions |
| `theme/` | MUI theme customization |
| `types/` | Shared TypeScript types |
| `utils/` | Utility functions |

## Running

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```
