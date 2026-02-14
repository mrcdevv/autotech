# Logging Rules

1. Use SLF4J with `@Slf4j` Lombok annotation.
2. Use parameterized logging: `log.info("Processing order {}", orderId)`. Never use string concatenation.
3. Never log sensitive data (passwords, tokens, personal identification numbers).
4. Log levels:
   - `ERROR`: Unexpected failures that require attention.
   - `WARN`: Handled but unexpected situations.
   - `INFO`: Business events (entity created, order completed, etc.).
   - `DEBUG`: Detailed troubleshooting info (only enabled in dev).
5. Log entry and exit of service methods at DEBUG level for important operations.

## Example

```java
@Slf4j
@Service
public class RepairOrderServiceImpl implements RepairOrderService {

    @Override
    public RepairOrderResponse create(RepairOrderRequest request) {
        log.debug("Creating repair order for vehicle {}", request.vehicleId());
        // ... business logic ...
        log.info("Repair order {} created successfully", saved.getId());
        return response;
    }

    @Override
    public void updateStatus(Long id, OrderStatus newStatus) {
        log.info("Updating repair order {} status to {}", id, newStatus);
        // ... business logic ...
    }
}
```

## What NOT to do

```java
// WRONG: string concatenation
log.info("Processing order " + orderId);

// WRONG: logging sensitive data
log.info("User logged in with password {}", password);

// WRONG: excessive logging in loops
for (Item item : items) {
    log.info("Processing item {}", item.getId()); // Use DEBUG instead
}
```
