# Entity Rules

1. Annotate with `@Entity` and `@Table(name = "...")`.
2. Use `@Getter` and `@Setter` from Lombok. Do NOT use `@Data` on entities (it breaks JPA proxy equals/hashCode).
3. Use `@Builder` and `@NoArgsConstructor(access = AccessLevel.PROTECTED)` / `@AllArgsConstructor` when needed. Protected no-arg constructor satisfies JPA while discouraging misuse.
4. Extend `BaseEntity` for id, createdAt, and updatedAt fields.
5. ID is inherited from `BaseEntity` (`@Id` + `@GeneratedValue(strategy = GenerationType.IDENTITY)`).
6. Use `FetchType.LAZY` for ALL relationships. No exceptions unless profiling proves otherwise.
7. Use `@Column` to explicitly name database columns in snake_case.
8. Validation annotations (`@NotBlank`, `@Size`, `@Email`, etc.) go on the entity for DB-level constraints and on DTOs for API-level validation.

## Equals and HashCode

Never let Lombok generate equals/hashCode for entities. Override manually using only the business key or the `id` field with null-safety:

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Client other)) return false;
    return getId() != null && getId().equals(other.getId());
}

@Override
public int hashCode() {
    return getClass().hashCode();
}
```

This pattern works correctly with JPA proxies and lazy loading.

## Builder and BaseEntity

When using `@Builder` on an entity that extends `BaseEntity`, the generated builder does NOT include `BaseEntity` fields (`id`, `createdAt`, `updatedAt`). This is expected -- those fields are managed by JPA (`@GeneratedValue`, `@PrePersist`, `@PreUpdate`). Never try to set them via the builder.

When writing manual mappers (see `dto-rules.md`), use `entity.getId()` / `entity.getCreatedAt()` / `entity.getUpdatedAt()` directly -- these come from Lombok's `@Getter` on `BaseEntity` and are always available at runtime.

## OneToMany Collections — Use `Set`, NOT `List`

When an entity has multiple `@OneToMany` collections, **always use `Set<T>` (with `HashSet`)**, never `List<T>` (with `ArrayList`).

Hibernate treats `List` as a "bag" type. When a `@EntityGraph` or eager fetch tries to load two or more `List`-typed collections simultaneously, Hibernate throws `MultipleBagFetchException: cannot simultaneously fetch multiple bags`. Using `Set` avoids this because Hibernate treats sets differently.

```java
// CORRECT — always use Set for @OneToMany
@OneToMany(mappedBy = "invoice", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
@Builder.Default
private Set<InvoiceServiceItem> services = new HashSet<>();

// WRONG — List causes MultipleBagFetchException when combined with @EntityGraph
@OneToMany(mappedBy = "invoice", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
@Builder.Default
private List<InvoiceServiceItem> services = new ArrayList<>();
```

**Rule**: Even if the entity currently has only one `@OneToMany`, use `Set` to be safe for future additions.

## Enum Fields

Use `@Enumerated(EnumType.STRING)` always. Never use `EnumType.ORDINAL` (breaks if enum order changes).

## Example

```java
@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Client extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "client_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ClientType clientType;

    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Vehicle> vehicles = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Client other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```
