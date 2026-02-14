# Service Rules

## Service Layer Pattern

1. Define a service interface (e.g., `ClientService`).
2. Implement in a `ServiceImpl` class (e.g., `ClientServiceImpl`) annotated with `@Service`.
3. Use `@RequiredArgsConstructor` for constructor injection. Never use `@Autowired` field injection.
4. All dependencies must be `private final` fields.
5. Return DTOs from service methods, not entities.
6. For existence checks, use `.findById().orElseThrow(() -> new ResourceNotFoundException(...))`.
7. Wrap write operations with `@Transactional`. Read-only operations use `@Transactional(readOnly = true)`.

## Module Boundaries (Low Coupling)

- A service injects its own repository and mappers directly.
- To access another module's data or behavior, inject that module's **service interface** (never its repository or entities).
- This keeps modules decoupled: if the internals of module B change, module A is unaffected.

```java
// CORRECT: RepairOrderService injects EstimateService interface
@RequiredArgsConstructor
public class RepairOrderServiceImpl implements RepairOrderService {
    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderMapper repairOrderMapper;
    private final EstimateService estimateService;       // interface from another module
    private final InspectionService inspectionService;   // interface from another module
}

// WRONG: injecting another module's repository
private final EstimateRepository estimateRepository; // violates module boundary
```

## Cross-Module Orchestration

When a service needs to coordinate operations across modules, it does so directly by calling the injected service interfaces. No extra layer needed.

The repair order service is the natural orchestrator because the repair order is the aggregate that owns the relationship with estimates, inspections, and invoices. It calls their services to perform operations within its context.

Each sub-entity service (EstimateService, InspectionService, etc.) also works standalone through its own controller for operations that don't involve a repair order.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class RepairOrderServiceImpl implements RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderMapper repairOrderMapper;
    private final EstimateService estimateService;
    private final InspectionService inspectionService;

    @Override
    @Transactional
    public InspectionResponse addInspection(Long repairOrderId, InspectionRequest request) {
        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", repairOrderId));

        estimateService.validateApproved(order.getEstimateId());
        return inspectionService.createForRepairOrder(repairOrderId, request);
    }
}
```

## Simple Service Example

```java
public interface ClientService {
    ClientResponse getById(Long id);
    ClientResponse create(ClientRequest request);
    List<ClientResponse> getAll();
}

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getById(Long id) {
        log.debug("Fetching client with id {}", id);
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        return clientMapper.toResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse create(ClientRequest request) {
        Client client = clientMapper.toEntity(request);
        Client saved = clientRepository.save(client);
        log.info("Created client with id {}", saved.getId());
        return clientMapper.toResponse(saved);
    }
}
```
