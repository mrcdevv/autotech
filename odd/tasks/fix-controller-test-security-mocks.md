# Fix Legacy Controller Test Security Beans

## Context

- **Branch**: `feature/settings-redesign` (local-only, 5 commits ahead of develop)
- **Goal**: Make `./mvnw clean test` green by fixing the pre-existing `@WebMvcTest` slice failures.

## Problem

`SecurityConfig` (with `@EnableWebSecurity`) is auto-included in the `@WebMvcTest` slice. Its filter chain injects `JwtAuthenticationFilter`, which requires two `@Component` beans:
- `JwtTokenProvider`
- `CustomUserDetailsService`

Legacy controller tests don't mock these, so the slice fails to start with:
`UnsatisfiedDependencyException: No qualifying bean of type 'com.autotech.security.JwtTokenProvider'`.

New tests (`RoleControllerTest`, `RepairOrderControllerTest`) already fix this by adding `@MockitoBean` fields for both beans.

## Fix

For each of the 13 legacy controller test classes, add:
1. Imports `com.autotech.security.JwtTokenProvider` and `com.autotech.security.CustomUserDetailsService`.
2. Two fields:
   ```java
   @MockitoBean
   private JwtTokenProvider jwtTokenProvider;

   @MockitoBean
   private CustomUserDetailsService customUserDetailsService;
   ```
   (using `org.springframework.test.context.bean.override.mockito.MockitoBean`, already imported in these files)

## Files to fix (13)

1. `appointment/controller/AppointmentControllerTest.java`
2. `appointment/controller/CalendarConfigControllerTest.java`
3. `bankaccount/controller/BankAccountControllerTest.java`
4. `catalog/controller/CannedJobControllerTest.java`
5. `catalog/controller/CatalogServiceControllerTest.java`
6. `catalog/controller/ProductControllerTest.java`
7. `dashboard/controller/DashboardControllerTest.java`
8. `estimate/controller/EstimateControllerTest.java`
9. `invoice/controller/InvoiceControllerTest.java`
10. `payment/controller/PaymentControllerTest.java`
11. `tag/controller/TagControllerTest.java`
12. `vehicle/controller/BrandControllerTest.java`
13. `vehicle/controller/VehicleControllerTest.java`

## Acceptance

- `./mvnw clean test` exits 0 with no `UnsatisfiedDependencyException`.
- Existing test assertions unchanged (only bean wiring added).

## Result

- 13 files fixed (2 imports + 2 `@MockitoBean` fields each).
- Targeted run: 101 tests, 0 failures, 0 errors.
- Full `./mvnw clean test`: **405 tests, 0 failures, 0 errors — BUILD SUCCESS**.
- Smoke test: app boots (16s), Flyway v8 applied, login + `GET /api/roles` + `GET /api/tax-config` all HTTP 200.

## Commit log

- `c40b4c5` (rebased → `6bf94a1`) test: mock security beans in legacy WebMvcTest controller tests
- `6c6fc1f` test: mock InvoicePdfService in InvoiceControllerTest (post-rebase, develop's invoice PDF integration)

Pushed to `origin/feature/settings-redesign` (rebased onto `b8d78d5`).
