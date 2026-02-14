# Controller Rules

1. Annotate with `@RestController`.
2. Use class-level `@RequestMapping("/api/{resource}")` for base paths.
3. Use `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` for operations.
4. Paths must be resource-based: `/api/clients/{id}`. Never use verbs like `/api/getClient`.
5. Use `@RequiredArgsConstructor` for constructor injection.
6. Return `ResponseEntity<ApiResponse<T>>` from all endpoints.
7. Use `@Valid` on request body parameters to trigger validation.
8. Do NOT put try-catch blocks in controllers -- `GlobalExceptionHandler` handles all exceptions.
9. Controllers are **thin**: they only validate input, call a service or facade, and return the response. No business logic.

## When to inject what

- **Simple CRUD** on one entity: inject the module's `Service`.
- **Cross-module operations** (e.g., repair order + estimate): inject the module's `Facade`.
- A controller may inject both a service and a facade.

## Example

```java
@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(clientService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(@Valid @RequestBody ClientRequest request) {
        ClientResponse created = clientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Client created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(ApiResponse.success(clientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Client deleted", null));
    }
}
```
