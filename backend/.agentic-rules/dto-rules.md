# DTO Rules

1. Use Java `record` types for DTOs (request and response). Records are immutable by design.
2. Apply Jakarta Validation annotations on **request DTOs** (`@NotBlank`, `@NotNull`, `@Email`, `@Size`, etc.).
3. Response DTOs carry no validation annotations.
4. **Use manual mapper classes** annotated with `@Component` for entity-DTO mapping. Do NOT use MapStruct interfaces (see "Why manual mappers" below).
5. Never put business logic inside DTOs.
6. DTOs belong to their feature module: `com.autotech.client.dto.ClientRequest`.

## Naming Convention

- `{Entity}Request` -- for create/update input
- `{Entity}Response` -- for single entity output
- `{Entity}DetailResponse` -- for entity with nested related data (e.g., repair order with its estimates)

## Why Manual Mappers Instead of MapStruct

MapStruct generates source code at compile time via annotation processing. When VS Code's JDT (Java Language Server) is active, it runs its own Eclipse compiler in the background which **overwrites** Maven's correctly compiled `*MapperImpl.class` files in `target/classes/` with broken versions. The JDT compiler cannot properly resolve Lombok-generated methods (getters/setters from `BaseEntity`) in the generated MapStruct code, producing classes that fail at runtime with "Unresolved compilation problems".

This causes `spring-boot:run` to fail with errors like:
- `No qualifying bean of type 'XxxMapper' available`
- `Unresolved compilation problems: The method getId() is undefined for the type Xxx`

**The fix**: Use plain `@Component` classes with manual mapping methods instead of MapStruct `@Mapper` interfaces. This avoids annotation processing entirely and works reliably with both Maven and the IDE.

## Mapper Pattern

Mappers are `@Component` classes (not interfaces). Use the entity's `@Builder` for `toEntity()` and direct constructor for `toResponse()`:

```java
@Component
public class ClientMapper {

    public ClientResponse toResponse(Client entity) {
        if (entity == null) return null;
        return new ClientResponse(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getPhone(),
                entity.getClientType(),
                entity.getCreatedAt()
        );
    }

    public Client toEntity(ClientRequest request) {
        if (request == null) return null;
        return Client.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phone(request.phone())
                .clientType(request.clientType())
                .build();
    }

    public List<ClientResponse> toResponseList(List<Client> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
```

## Example

```java
public record ClientRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        String phone,

        @NotNull(message = "Client type is required")
        ClientType clientType
) {}

public record ClientResponse(
        Long id,
        String firstName,
        String lastName,
        String phone,
        ClientType clientType,
        LocalDateTime createdAt
) {}
```
