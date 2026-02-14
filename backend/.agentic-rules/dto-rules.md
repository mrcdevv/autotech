# DTO Rules

1. Use Java `record` types for DTOs (request and response). Records are immutable by design.
2. Apply Jakarta Validation annotations on **request DTOs** (`@NotBlank`, `@NotNull`, `@Email`, `@Size`, etc.).
3. Response DTOs carry no validation annotations.
4. Use MapStruct interfaces annotated with `@Mapper(componentModel = "spring")` for entity-DTO mapping.
5. Never put business logic inside DTOs.
6. DTOs belong to their feature module: `com.autotech.client.dto.ClientRequest`.

## Naming Convention

- `{Entity}Request` -- for create/update input
- `{Entity}Response` -- for single entity output
- `{Entity}DetailResponse` -- for entity with nested related data (e.g., repair order with its estimates)

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

@Mapper(componentModel = "spring")
public interface ClientMapper {
    ClientResponse toResponse(Client entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vehicles", ignore = true)
    Client toEntity(ClientRequest request);
}
```
