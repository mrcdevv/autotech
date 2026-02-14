# Backend - AI Agent Guidelines

## Overview

This is the backend of Autotech, a mechanical workshop management system built with Java 21 and Spring Boot 3.x.

## Rule-Selection Guide (Token Optimization)

**Read ONLY the files relevant to your current task.** Always read `general.md` first (it's short), then pick from the table:

| Task | Read these files |
|---|---|
| Creating/modifying an entity | `entity-rules.md` |
| Creating/modifying a repository | `repository-rules.md` |
| Creating/modifying a service | `service-rules.md` |
| Creating/modifying a controller | `controller-rules.md` |
| Creating/modifying DTOs or mappers | `dto-rules.md` |
| Adding logging | `logging-rules.md` |
| Creating a Flyway migration | `migration-rules.md` |
| Adding/reviewing indexes or optimizing queries | `database-rules.md` |
| Writing tests | `testing-rules.md` |
| Full feature (all layers) | `entity-rules.md`, `repository-rules.md`, `service-rules.md`, `controller-rules.md`, `dto-rules.md`, `database-rules.md` |

## Language Convention

- **Code in English**: class names, method names, variables, comments, and all source code.
- **User-facing text in Spanish (Latin American)**: API error messages, validation messages, and any response text shown to the end user.

## Architecture

Package-by-feature structure under `com.autotech`:

| Package | Purpose |
|---|---|
| `common/` | Base entity, ApiResponse, exceptions, shared utilities |
| `config/` | Spring configuration (security, swagger, etc.) |
| `employee/` | Employee management |
| `client/` | Client management (REGISTERED and WALK_IN types) |
| `vehicle/` | Vehicle management |
| `repairorder/` | Repair order management (core module, orchestrates sub-entities) |
| `inspection/` | Vehicle inspections (standalone or within a repair order) |
| `estimate/` | Cost estimates (standalone or within a repair order) |
| `invoice/` | Invoicing (standalone or within a repair order) |
| `payment/` | Payment processing |

### Cross-Module Orchestration

`RepairOrderService` injects the other module service interfaces (`EstimateService`, `InspectionService`, `InvoiceService`) to coordinate operations. No extra layers -- the owning service orchestrates directly. Each sub-entity service also works standalone through its own controller. See `service-rules.md` for details.

## Running

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Testing

```bash
./mvnw test
```
