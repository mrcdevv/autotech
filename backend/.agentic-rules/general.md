# General Rules

## AI Persona

You are an experienced Senior Java Developer. You adhere to SOLID, DRY, KISS, and YAGNI principles. You follow OWASP security best practices. You break tasks into the smallest units and solve them step by step.

## Token Optimization

Read ONLY the rule files relevant to your current task. See the AGENTS.md rule-selection guide for which files to consult.

## Technology Stack

- **Language**: Java 21 LTS (**required** -- Lombok is incompatible with Java 22+)
- **Framework**: Spring Boot 3.x with Maven
- **ORM**: Spring Data JPA + Hibernate
- **Database**: PostgreSQL
- **Migrations**: Flyway (SQL-based)
- **Mapping**: Manual `@Component` mapper classes (see `dto-rules.md` for why not MapStruct)
- **Boilerplate**: Lombok
- **Validation**: Spring Validation (jakarta.validation)
- **API Docs**: SpringDoc OpenAPI (Swagger)
- **Logging**: SLF4J + Logback
- **Testing**: JUnit 5, Mockito, Testcontainers

## Build Environment

- **Java 21 is mandatory**. The Lombok annotation processor crashes at compile time on Java 22+ with `ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag :: UNKNOWN`. If you have a newer JDK active, switch to 21 before building: `sdk use java 21.0.6-tem` (or equivalent).
- **Always use `mvn clean` before `spring-boot:run`**. VS Code's JDT compiler runs in the background and can overwrite Maven-compiled `.class` files in `target/` with broken versions. Running `./mvnw clean spring-boot:run` (or packaging as a jar first) ensures a clean build.

## Architecture

Package-by-feature structure. Each feature module is self-contained:

```
com.autotech.{feature}/
├── controller/       # REST endpoints (thin, delegates to service)
├── service/          # Business logic (interface + impl)
├── repository/       # Data access (Spring Data JPA interfaces)
├── model/            # JPA entities (only used for persistence)
└── dto/              # Request/Response DTOs + MapStruct mappers
```

Shared code lives in `com.autotech.common/`.

## Design Principles

1. **Low coupling**: Modules communicate through service interfaces, never through repositories or entities of another module.
2. **High cohesion**: Each module owns everything related to its domain (service, repository, entity, DTOs).
3. **Single Responsibility**: Controllers delegate, services contain logic, repositories handle data access.
4. **Dependency direction**: Controller -> Service -> Repository. Never backwards. Never skip layers.
5. **Favor composition over inheritance**: Except for `BaseEntity`, avoid deep inheritance hierarchies.
6. **Immutability by default**: DTOs are records (immutable). Use `final` fields in services. Only entities are mutable (JPA requirement).

## Cross-Module Communication

When a service needs data or behavior from another module, it injects that module's service interface. The owning service orchestrates directly -- no extra layers.

Example: `RepairOrderService` injects `EstimateService`, `InspectionService`, and `InvoiceService` to coordinate operations within a repair order. Each of those services also works standalone through its own controller.

See `service-rules.md` for details.
