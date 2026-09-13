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

## Language Convention

- **Code must be written in English**: variable names, function names, class names, comments, commit messages, documentation, etc.
- **User-facing text must be in Spanish (Latin American)**: all UI labels, messages, notifications, error messages, placeholders, tooltips, and any text visible to the end user. This software is targeted at a Latin American audience.

## Environment Setup

### Java Version (Backend)

The backend **requires Java 21 LTS**. Lombok's annotation processor is incompatible with Java 22+ and will crash at compile time with `ExceptionInInitializerError`. Always verify: `java -version` must show `21.x.x`.

### IDE Build Interference (Backend)

VS Code's JDT (Java Language Server) runs its own Eclipse compiler in the background and can overwrite Maven-compiled `.class` files in `target/` with broken versions. This is especially problematic for Lombok-generated methods inherited from `BaseEntity` (getId, getCreatedAt, etc.). **Always use `./mvnw clean` before `spring-boot:run` or `package`**.

### JPA Collections (Backend)

`@OneToMany` collections **must use `Set<T>` (with `HashSet`)**, never `List<T>` (with `ArrayList`). Hibernate throws `MultipleBagFetchException` when a `@EntityGraph` tries to fetch two or more `List`-typed collections simultaneously. Using `Set` avoids this entirely. See `backend/.agentic-rules/entity-rules.md` for details.

> **Spec files note**: Some specs in `docs/specs/` may still show `List<T>` in entity code examples. **Always use `Set<T>`**. The `.agentic-rules/` conventions take precedence over spec code examples.

### Mappers (Backend)

Use **manual `@Component` mapper classes**, not MapStruct interfaces. MapStruct's generated code gets corrupted by the IDE's background compiler. See `backend/.agentic-rules/dto-rules.md` for the full pattern.

> **Spec files note**: Some specs in `docs/specs/` may still show MapStruct `@Mapper` interfaces in their code examples. **Ignore that pattern** -- always use manual `@Component` mappers as defined in `dto-rules.md`. The `.agentic-rules/` conventions take precedence over spec code examples.

### Missing Dependencies

Before writing code that requires a new dependency (e.g., Apache POI for Excel export), **check pom.xml** first and add it if missing. Do not assume any library is present just because a spec references it.

## General Rules

1. Never expose sensitive data in logs, responses, or commits.
2. Always use DTOs for API communication — never expose JPA entities directly.
3. Keep the architecture clean but simple. Avoid over-engineering.
4. Follow the coding rules in each subfolder's `.agentic-rules` file.
5. When in doubt, prioritize readability and simplicity over cleverness.
6. Always verify the build compiles and the app starts before considering a task complete.
