# Testing Rules

## Naming Convention: Given-When-Then (BDD)

All test methods follow the pattern: `given{Precondition}_when{Action}_then{ExpectedResult}`

Examples:
- `givenValidId_whenGetClient_thenReturnClientResponse()`
- `givenInvalidId_whenGetClient_thenThrowResourceNotFoundException()`
- `givenValidRequest_whenCreateClient_thenReturnCreatedClient()`
- `givenDuplicateEmail_whenCreateClient_thenThrowIllegalArgumentException()`
- `givenUnapprovedEstimate_whenAddInspection_thenThrowIllegalStateException()`

## Test Types

1. **Unit tests**: JUnit 5 + Mockito. Test service classes by mocking dependencies.
   - Class naming: `{ClassName}Test` (e.g., `ClientServiceImplTest`)
   - Location: same package under `src/test/java`
2. **Integration tests**: `@SpringBootTest` + Testcontainers (real PostgreSQL).
   - Class naming: `{ClassName}IT` (e.g., `ClientControllerIT`)
   - Location: same package under `src/test/java`

## Structure: Arrange-Act-Assert

Every test follows this three-section structure with blank lines between sections:

```java
@Test
void givenValidId_whenGetClient_thenReturnClientResponse() {
    // Arrange
    Client client = Client.builder().firstName("John").lastName("Doe").build();
    client.setId(1L);
    ClientResponse expected = new ClientResponse(1L, "John", "Doe", null, ClientType.REGISTERED, null);
    when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
    when(clientMapper.toResponse(client)).thenReturn(expected);

    // Act
    ClientResponse result = clientService.getById(1L);

    // Assert
    assertThat(result).isEqualTo(expected);
    verify(clientRepository).findById(1L);
}
```

## Assertions

- Use AssertJ (`assertThat`) over JUnit assertions for readability.
- Use `assertThatThrownBy` for exception testing.
- Verify mock interactions with `verify()` only when the interaction itself is the behavior being tested.

## Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class ClientServiceImplTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ClientMapper clientMapper;

    @InjectMocks
    private ClientServiceImpl clientService;

    @Test
    void givenValidId_whenGetClient_thenReturnClientResponse() {
        // Arrange
        Client client = Client.builder().firstName("John").lastName("Doe").build();
        client.setId(1L);
        ClientResponse expected = new ClientResponse(1L, "John", "Doe", null, ClientType.REGISTERED, null);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(clientMapper.toResponse(client)).thenReturn(expected);

        // Act
        ClientResponse result = clientService.getById(1L);

        // Assert
        assertThat(result).isEqualTo(expected);
    }

    @Test
    void givenNonExistentId_whenGetClient_thenThrowResourceNotFoundException() {
        // Arrange
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> clientService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenCreateClient_thenReturnCreatedClient() {
        // Arrange
        ClientRequest request = new ClientRequest("John", "Doe", "555-1234", ClientType.REGISTERED);
        Client entity = Client.builder().firstName("John").lastName("Doe").build();
        Client saved = Client.builder().firstName("John").lastName("Doe").build();
        saved.setId(1L);
        ClientResponse expected = new ClientResponse(1L, "John", "Doe", "555-1234", ClientType.REGISTERED, null);

        when(clientMapper.toEntity(request)).thenReturn(entity);
        when(clientRepository.save(entity)).thenReturn(saved);
        when(clientMapper.toResponse(saved)).thenReturn(expected);

        // Act
        ClientResponse result = clientService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.firstName()).isEqualTo("John");
    }
}
```

## Integration Test Example

```java
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ClientControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void givenValidRequest_whenCreateClient_thenReturnCreatedStatus() throws Exception {
        // Arrange
        ClientRequest request = new ClientRequest("John", "Doe", "555-1234", ClientType.REGISTERED);

        // Act & Assert
        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.firstName").value("John"));
    }
}
```

## Error Handling in Tests

All exceptions are handled by `GlobalExceptionHandler`. In integration tests, verify the HTTP status and error response structure, not the exception class directly.
