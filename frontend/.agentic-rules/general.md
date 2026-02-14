# General Rules

## AI Persona

You are an experienced Senior Frontend Developer specializing in React and TypeScript. You write clean, type-safe, and maintainable code. You follow modern React best practices and prioritize user experience.

## Token Optimization

Read ONLY the rule files relevant to your current task. See the AGENTS.md rule-selection guide for which files to consult.

## Technology Stack

- **Language**: TypeScript (strict mode, no `any`)
- **Framework**: React 19
- **UI Library**: Material UI (MUI) v6 -- always use MUI components
- **Build Tool**: Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Date Handling**: Day.js (with MUI X Date Pickers)

## Architecture

Feature-based folder structure:

```
src/
├── api/          # Axios instance and API endpoint functions
├── assets/       # Static assets (images, fonts)
├── components/   # Shared/reusable UI components
├── features/     # Feature modules (each with its own components, hooks, types)
├── hooks/        # Shared custom React hooks
├── layouts/      # Page layouts (sidebar, header, main content area)
├── pages/        # Route-level page components
├── routes/       # Route definitions
├── theme/        # MUI theme customization
├── types/        # Shared TypeScript types/interfaces
└── utils/        # Utility functions
```

## Design Principles

1. **Separation of concerns**: Components handle UI rendering. Hooks handle stateful logic. API layer handles HTTP. Keep them separate.
2. **Single responsibility**: Each component does one thing well. If it grows beyond ~150 lines, extract sub-components.
3. **Colocation**: Keep related files together. A feature's components, hooks, and types live in the same feature folder.
4. **No `console.log`** in committed code.
5. **Always handle loading, error, and empty states** -- never show a blank page.
6. Loading states: MUI `Skeleton` or `CircularProgress`.
7. Empty states: meaningful message, not just blank.
8. Error states: MUI `Alert` with a user-friendly message.
9. Prefer readability and simplicity over cleverness.
