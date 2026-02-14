# Repository Rules

1. Annotate with `@Repository`.
2. Must be interfaces extending `JpaRepository<Entity, Long>`.
3. Use JPQL for `@Query` methods unless native SQL is necessary.
4. Use `@EntityGraph(attributePaths = {"relatedEntity"})` on relationship queries to prevent N+1 problems.
5. Return `Optional<Entity>` for single-result queries.
6. Repositories are **private to their module**. Other modules must access data through the module's service interface, never by injecting another module's repository.

## Example

```java
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByPhone(String phone);

    @EntityGraph(attributePaths = {"vehicles"})
    Optional<Client> findWithVehiclesById(Long id);

    @Query("SELECT c FROM Client c WHERE c.clientType = :type")
    List<Client> findByClientType(@Param("type") ClientType type);

    boolean existsByEmail(String email);
}
```
