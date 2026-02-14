# Autotech - AI Agent Guidelines

## Project Overview

Autotech is a mechanical workshop management system. It manages employees, clients, vehicles, repair orders, inspections, estimates, invoices, and payments. The core functionality revolves around the repair order, which can contain estimates, inspections, and invoices. However, these entities can also exist independently outside of a repair order.

## Monorepo Structure

- `frontend/` — React 19 + TypeScript + Material UI v6 (built with Vite)
- `backend/` — Java 21 + Spring Boot 3.x + PostgreSQL (built with Maven)

Each subfolder has its own `AGENTS.md` and `.agentic-rules/` folder with specific coding conventions.

**Token optimization**: Each subfolder's `AGENTS.md` contains a **rule-selection guide**. Read ONLY the rule files relevant to your current task (e.g., if creating a DTO, read only `dto-rules.md`, not all rules).

## Domain Context

- **Clients** can be `REGISTERED` (full profile) or `WALK_IN` (minimal info: name + phone). Always create a client record — never duplicate client data into other tables.
- **Repair Orders** are the central entity. They can contain estimates, inspections, and invoices, but those entities can also be created standalone.
- **Inspections** are used by mechanics to report what is good, what needs a fix, and what needs a fix but is not urgent.
- **Estimates** must be approved before certain operations (e.g., adding inspections to a repair order), but this rule may evolve.

## Git Conventions

### Branch Naming
- `feature/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `refactor/<short-description>` — code refactoring
- `chore/<short-description>` — maintenance tasks

### Commit Messages
Use conventional commits:
- `feat: add client registration endpoint`
- `fix: correct invoice total calculation`
- `refactor: extract repair order validation`
- `chore: update dependencies`
- `test: add unit tests for estimate service`

## General Rules

1. Never expose sensitive data in logs, responses, or commits.
2. Always use DTOs for API communication — never expose JPA entities directly.
3. Keep the architecture clean but simple. Avoid over-engineering.
4. Follow the coding rules in each subfolder's `.agentic-rules` file.
5. When in doubt, prioritize readability and simplicity over cleverness.
