# 13 — Autenticación

> **STATUS: DEFERRED** — This spec documents the planned architecture for authentication. Implementation is postponed to a future iteration. All sections below describe the **intended design** but should not be implemented until this spec is officially activated.

## 1. Overview

This feature implements **Authentication** for Autotech — login, session management, and protected routes. It uses **JWT-based authentication** with Spring Security on the backend and protected route wrappers on the frontend.

Key capabilities:

- **Login**: Username + password fields, submit to backend, receive JWT token.
- **Session management**: Store JWT in memory (with optional refresh token in httpOnly cookie), attach to API requests via `Authorization: Bearer` header.
- **Protected routes**: Frontend route guard that redirects unauthenticated users to `/login`.
- **Role-based access**: Conditionally render UI elements based on the authenticated user's roles and permissions.
- **Forgot password**: Placeholder/deferred — link present on login page but functionality TBD.

> **Dependency**: Employees (spec 01) — employees are the users of the system. This spec adds `username` and `password_hash` columns to the `employees` table.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/autenticacion` |
| Base | `main` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add V2 migration for username and password_hash on employees`
- `feat: add AuthService with JWT token generation and validation`
- `feat: add AuthController with login endpoint`
- `feat: configure Spring Security with JWT filter`
- `feat: add LoginPage with username and password form`
- `feat: add AuthContext and ProtectedRoute wrapper`
- `test: add unit tests for AuthService`

---

## 3. DB Tables

### 3.1 New Migration — `V2__add_auth_fields.sql`

> **DEFERRED**: This migration will be created when the spec is activated.

Adds authentication fields to the existing `employees` table:

```sql
ALTER TABLE employees
    ADD COLUMN username VARCHAR(50) UNIQUE,
    ADD COLUMN password_hash VARCHAR(255);
```

| Column | Type | Constraints |
|---|---|---|
| `username` | `VARCHAR(50)` | UNIQUE, nullable initially (will be NOT NULL after data migration) |
| `password_hash` | `VARCHAR(255)` | nullable initially (will be NOT NULL after data migration) |

> **Note**: Columns are initially nullable to allow gradual migration of existing employee records. A subsequent data migration or admin action will populate usernames and default passwords for existing employees.

### 3.2 Referenced Tables

| Table | Purpose |
|---|---|
| `employees` | Users of the system (with new `username` and `password_hash` fields) |
| `employee_roles` | Maps employees to roles for authorization |
| `roles` | Role definitions (`ADMINISTRADOR`, `JEFE_TALLER`, `MECANICO`, `RECEPCIONISTA`) |
| `role_permissions` | Maps roles to granular permissions |
| `permissions` | Permission definitions (e.g., `create_client`, `read_order`, `manage_config`) |

---

## 4. Backend

> **DEFERRED**: All backend components described below are planned but not yet implemented.

### 4.1 Package Structure

```
com.autotech.auth/
├── controller/
│   └── AuthController.java
├── service/
│   ├── AuthService.java                    (interface)
│   ├── AuthServiceImpl.java               (implementation)
│   └── JwtService.java                    (JWT token utility)
├── dto/
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   └── AuthenticatedUserResponse.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── CustomUserDetailsService.java
│   └── SecurityConfig.java               (updates existing SecurityConfig)
└── config/
    └── JwtProperties.java                 (configuration properties)
```

### 4.2 Configuration — `JwtProperties`

Location: `com.autotech.auth.config.JwtProperties`

```java
@ConfigurationProperties(prefix = "autotech.jwt")
public record JwtProperties(
    String secret,          // JWT signing secret (min 256 bits)
    Long expirationMs,      // Token expiration in milliseconds (default: 86400000 = 24h)
    Long refreshExpirationMs // Refresh token expiration (default: 604800000 = 7 days)
) {}
```

`application.yml` entries:

```yaml
autotech:
  jwt:
    secret: ${JWT_SECRET}  # Must be set via environment variable, never hardcoded
    expiration-ms: 86400000
    refresh-expiration-ms: 604800000
```

### 4.3 DTOs

Location: `com.autotech.auth.dto`

#### `LoginRequest`

```java
public record LoginRequest(

    @NotBlank(message = "El nombre de usuario es obligatorio")
    String username,

    @NotBlank(message = "La contraseña es obligatoria")
    String password
) {}
```

#### `LoginResponse`

```java
public record LoginResponse(
    String accessToken,
    String tokenType,
    Long expiresIn,
    AuthenticatedUserResponse user
) {}
```

#### `AuthenticatedUserResponse`

```java
public record AuthenticatedUserResponse(
    Long id,
    String firstName,
    String lastName,
    String username,
    List<String> roles,
    List<String> permissions
) {}
```

### 4.4 Service — `JwtService`

Location: `com.autotech.auth.service.JwtService`

```java
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    public String generateToken(UserDetails userDetails) {
        // 1. Build claims: subject = username, roles, permissions
        // 2. Sign with HMAC-SHA256 using jwtProperties.secret()
        // 3. Set expiration to now + jwtProperties.expirationMs()
        // 4. Return compact JWT string
    }

    public String extractUsername(String token) {
        // Parse token and return subject claim
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        // 1. Extract username from token
        // 2. Verify username matches and token is not expired
    }

    private boolean isTokenExpired(String token) {
        // Check expiration claim against current time
    }
}
```

### 4.5 Service — `AuthService`

```java
public interface AuthService {

    LoginResponse login(LoginRequest request);

    AuthenticatedUserResponse getCurrentUser();
}
```

#### `AuthServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 1. Authenticate using Spring Security AuthenticationManager
        //    - Throws BadCredentialsException if invalid
        // 2. Load UserDetails
        // 3. Generate JWT token
        // 4. Build and return LoginResponse with token and user info
    }

    @Override
    public AuthenticatedUserResponse getCurrentUser() {
        // 1. Get authenticated principal from SecurityContextHolder
        // 2. Build AuthenticatedUserResponse from principal
    }
}
```

### 4.6 Security — `CustomUserDetailsService`

Location: `com.autotech.auth.security.CustomUserDetailsService`

```java
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Find employee by username (new query on EmployeeRepository)
        // 2. If not found, throw UsernameNotFoundException
        // 3. Build Spring Security User with:
        //    - username
        //    - password_hash
        //    - authorities derived from employee's roles and permissions
    }
}
```

### 4.7 Security — `JwtAuthenticationFilter`

Location: `com.autotech.auth.security.JwtAuthenticationFilter`

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        // 1. Extract Authorization header
        // 2. If absent or not "Bearer ...", continue filter chain
        // 3. Extract token, validate it
        // 4. If valid, load UserDetails and set SecurityContext authentication
        // 5. Continue filter chain
    }
}
```

### 4.8 Security — `SecurityConfig` (update)

Location: `com.autotech.config.SecurityConfig` (existing file, to be updated)

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### 4.9 Controller — `AuthController`

Location: `com.autotech.auth.controller.AuthController`

Base path: `/api/auth`

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Inicio de sesión exitoso", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthenticatedUserResponse>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser()));
    }
}
```

### 4.10 EmployeeRepository (additions)

```java
Optional<Employee> findByUsername(String username);

boolean existsByUsername(String username);

boolean existsByUsernameAndIdNot(String username, Long id);
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `GET` | `/api/auth/me` | Get current authenticated user info |

---

## 5. Frontend

> **DEFERRED**: All frontend components described below are planned but not yet implemented.

### 5.1 Folder Structure

```
src/
├── api/
│   └── auth.ts
├── features/
│   └── auth/
│       ├── components/
│       │   └── ProtectedRoute.tsx
│       └── hooks/
│           └── useAuth.ts
├── context/
│   └── AuthContext.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── ForgotPasswordPage.tsx
└── types/
    └── auth.ts
```

### 5.2 Types

Location: `src/features/auth/types.ts`

```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface AuthenticatedUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  roles: string[];
  permissions: string[];
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUserResponse;
}

interface AuthContextType {
  user: AuthenticatedUserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}
```

### 5.3 API

Location: `src/api/auth.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { LoginRequest, LoginResponse, AuthenticatedUserResponse } from "@/features/auth/types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/login", data),

  getCurrentUser: () =>
    apiClient.get<ApiResponse<AuthenticatedUserResponse>>("/auth/me"),
};
```

### 5.4 Context — `AuthContext`

Location: `src/context/AuthContext.tsx`

```tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for stored token, validate with /api/auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem("autotech_token");
    if (storedToken) {
      setToken(storedToken);
      // Set Authorization header on apiClient
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      // Fetch current user to validate token
      authApi.getCurrentUser()
        .then((res) => setUser(res.data.data))
        .catch(() => { localStorage.removeItem("autotech_token"); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (request: LoginRequest) => {
    const res = await authApi.login(request);
    const { accessToken, user: userData } = res.data.data;
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("autotech_token", accessToken);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("autotech_token");
    delete apiClient.defaults.headers.common["Authorization"];
  };

  const hasRole = (role: string) => user?.roles.includes(role) ?? false;

  const hasPermission = (permission: string) => user?.permissions.includes(permission) ?? false;

  const value: AuthContextType = {
    user, token,
    isAuthenticated: !!user && !!token,
    loading,
    login, logout, hasRole, hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

### 5.5 Components

#### `ProtectedRoute`

Location: `src/features/auth/components/ProtectedRoute.tsx`

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredPermission, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <CircularProgress />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### 5.6 Pages

#### `LoginPage`

Location: `src/pages/LoginPage.tsx`

Route: `/login`

```tsx
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
    } catch {
      setError("Usuario y/o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Card sx={{ maxWidth: 400, width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ mb: 3 }}>Iniciar sesión</Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !username || !password}
              >
                {loading ? <CircularProgress size={24} /> : "Iniciar sesión"}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Link component={RouterLink} to="/olvide-contrasena" variant="body2">
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

#### `ForgotPasswordPage`

Location: `src/pages/ForgotPasswordPage.tsx`

Route: `/olvide-contrasena`

> **DEFERRED**: This page is a placeholder. The forgot password flow is TBD.

```tsx
export default function ForgotPasswordPage() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Card sx={{ maxWidth: 400, width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ mb: 2 }}>Recuperar contraseña</Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Esta funcionalidad estará disponible próximamente.
          </Typography>
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Volver a iniciar sesión
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

### 5.7 Routes

Location: `src/routes/`

```typescript
// Public routes (no auth required)
{ path: "/login", element: <LoginPage /> }
{ path: "/olvide-contrasena", element: <ForgotPasswordPage /> }

// All other routes wrapped with ProtectedRoute:
{
  path: "/",
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "empleados", element: <EmployeesPage /> },
    { path: "clientes", element: <ClientsPage /> },
    // ... all other routes
    {
      path: "configuracion",
      element: (
        <ProtectedRoute requiredPermission="manage_config">
          <SettingsPage />
        </ProtectedRoute>
      ),
    },
  ],
}
```

Lazy loaded:

```typescript
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
```

### 5.8 API Client Interceptor

Location: `src/api/client.ts` (update)

Add a response interceptor to handle 401 responses:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("autotech_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **DEFERRED** | All rules below describe planned behavior. None are implemented until this spec is activated. |
| 2 | **Employees are users** | The `employees` table is extended with `username` and `password_hash` columns. Every user of the system is an employee. |
| 3 | **Username must be unique** | Backend: `existsByUsername()` on create, `existsByUsernameAndIdNot()` on update. Throw `DuplicateResourceException` (HTTP 409). |
| 4 | **Password hashing** | Passwords are hashed with BCrypt before storage. The `password_hash` column stores the BCrypt hash. Raw passwords are never stored or logged. |
| 5 | **Default password** | When creating an employee, a default password is generated: first 3 lowercase letters of first name + last 3 digits of DNI (e.g., employee "Juan" with DNI "12345678" → password "jua678"). The employee should change it on first login (future enhancement). |
| 6 | **JWT token** | Stateless authentication using JWT. Token includes: `sub` (username), `roles`, `permissions`, `iat`, `exp`. Signed with HMAC-SHA256. Default expiration: 24 hours. |
| 7 | **JWT secret** | The JWT signing secret must be provided via environment variable `JWT_SECRET`. It must never be hardcoded in source code or committed to the repository. |
| 8 | **Login error message** | On invalid credentials, the API returns HTTP 401 with message "Usuario y/o contraseña incorrectos". The message is intentionally vague (does not reveal whether the username or password was wrong). |
| 9 | **Protected endpoints** | All `/api/**` endpoints require authentication except `/api/auth/**`. Spring Security enforces this via the `SecurityFilterChain` configuration. |
| 10 | **Role-based access** | Frontend uses `hasRole()` and `hasPermission()` from `AuthContext` to conditionally render UI elements. Backend uses Spring Security method-level annotations (`@PreAuthorize`) for endpoint-level authorization (future enhancement). |
| 11 | **Token storage** | The JWT access token is stored in `localStorage` under the key `autotech_token`. On each API request, the token is attached as `Authorization: Bearer {token}`. |
| 12 | **401 handling** | If any API call returns HTTP 401, the frontend clears the stored token and redirects to `/login`. |
| 13 | **Forgot password** | Deferred/placeholder. The link is present on the login page but redirects to a page showing "Esta funcionalidad estará disponible próximamente." |

---

## 7. Testing

> **DEFERRED**: Tests will be written when the spec is activated.

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `JwtServiceTest` | Token generation with correct claims, token validation (valid, expired, wrong username), username extraction |
| `AuthServiceImplTest` | Login happy path (returns token + user), login with invalid credentials (throws exception), getCurrentUser returns authenticated user |
| `CustomUserDetailsServiceTest` | loadUserByUsername happy path, loadUserByUsername with unknown username throws UsernameNotFoundException, authorities include roles and permissions |
| `AuthControllerTest` | `@WebMvcTest`: POST `/api/auth/login` returns 200 with token, POST `/api/auth/login` with invalid creds returns 401, GET `/api/auth/me` returns 200 with user info, GET `/api/auth/me` without token returns 401 |

### 7.2 Backend — Integration Tests

| Test Class | What it covers |
|---|---|
| `AuthIntegrationTest` | `@SpringBootTest` + Testcontainers: full login flow (create employee with username/password → login → use token to access protected endpoint → verify 401 without token) |

### 7.3 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `LoginPage.test.tsx` | Renders username and password fields, shows error on invalid credentials, redirects to home on successful login, forgot password link navigates to `/olvide-contrasena` |
| `ForgotPasswordPage.test.tsx` | Renders placeholder message, back to login link works |
| `ProtectedRoute.test.tsx` | Redirects to `/login` when not authenticated, renders children when authenticated, redirects to `/` when missing required role/permission |
| `AuthContext.test.tsx` | Login stores token and user, logout clears token and user, hasRole returns correct boolean, hasPermission returns correct boolean, restores session from localStorage on mount |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.
>
> ⚠️ **DEFERRED**: This spec is currently deferred. The checklist below documents all planned implementation items for when the spec is officially activated. Do not implement until the spec status changes.

### 8.1 Backend

- [ ] Create `V2__add_auth_fields.sql` migration — adds `username` (VARCHAR(50), UNIQUE) and `password_hash` (VARCHAR(255)) columns to `employees` table
- [ ] Add `username` and `passwordHash` fields to existing `Employee` entity
- [ ] Add repository methods to `EmployeeRepository`:
  - [ ] `findByUsername(String username)`
  - [ ] `existsByUsername(String username)`
  - [ ] `existsByUsernameAndIdNot(String username, Long id)`
- [ ] Create `JwtProperties` configuration record (`autotech.jwt.secret`, `expirationMs`, `refreshExpirationMs`)
- [ ] Create `LoginRequest` DTO with Jakarta Validation annotations (`@NotBlank` on `username` and `password`)
- [ ] Create `LoginResponse` DTO (record with `accessToken`, `tokenType`, `expiresIn`, `user`)
- [ ] Create `AuthenticatedUserResponse` DTO (record with `id`, `firstName`, `lastName`, `username`, `roles`, `permissions`)
- [ ] Create `JwtService`:
  - [ ] `generateToken(UserDetails)` — build claims, sign with HMAC-SHA256, set expiration
  - [ ] `extractUsername(String token)` — parse token and return subject
  - [ ] `isTokenValid(String token, UserDetails)` — verify username match and not expired
- [ ] Create `AuthService` interface with `login()` and `getCurrentUser()`
- [ ] Create `AuthServiceImpl`:
  - [ ] `login()` — authenticate via `AuthenticationManager`, generate JWT, return `LoginResponse`
  - [ ] `getCurrentUser()` — get principal from `SecurityContextHolder`, return `AuthenticatedUserResponse`
- [ ] Create `CustomUserDetailsService` implementing `UserDetailsService`:
  - [ ] `loadUserByUsername()` — find employee by username, build `UserDetails` with roles and permissions as authorities
- [ ] Create `JwtAuthenticationFilter` extending `OncePerRequestFilter`:
  - [ ] Extract `Authorization: Bearer` header, validate token, set `SecurityContext`
- [ ] Update `SecurityConfig`:
  - [ ] Configure stateless session management
  - [ ] Permit `/api/auth/**` without authentication
  - [ ] Require authentication for all other `/api/**` endpoints
  - [ ] Register `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
  - [ ] Configure `BCryptPasswordEncoder` and `AuthenticationManager` beans
- [ ] Create `AuthController`:
  - [ ] `POST /api/auth/login` — authenticate and return JWT token
  - [ ] `GET /api/auth/me` — return current authenticated user info
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file (`src/features/auth/types.ts`) with `LoginRequest`, `AuthenticatedUserResponse`, `LoginResponse`, `AuthContextType`
- [ ] Create API layer (`src/api/auth.ts`) with `login` and `getCurrentUser`
- [ ] Create `AuthContext` (`src/context/AuthContext.tsx`) with `AuthProvider` and `useAuth` hook:
  - [ ] Token storage in `localStorage` (key: `autotech_token`)
  - [ ] `login()`, `logout()`, `hasRole()`, `hasPermission()` methods
  - [ ] On mount: restore session from stored token via `/api/auth/me`
- [ ] Create `LoginPage` (`src/pages/LoginPage.tsx`) with username/password form, error handling, redirect on success
- [ ] Create `ForgotPasswordPage` (`src/pages/ForgotPasswordPage.tsx`) — placeholder with "próximamente" message
- [ ] Create `ProtectedRoute` component (`src/features/auth/components/ProtectedRoute.tsx`) — redirects to `/login` if unauthenticated, supports `requiredRole` and `requiredPermission` props
- [ ] Update API client interceptor (`src/api/client.ts`) — handle 401 responses by clearing token and redirecting to `/login`
- [ ] Register routes:
  - [ ] `/login` (public, lazy loaded)
  - [ ] `/olvide-contrasena` (public, lazy loaded)
  - [ ] Wrap all other routes with `ProtectedRoute`
  - [ ] Wrap `/configuracion` with `requiredPermission="manage_config"`
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Employees are users — `employees` table extended with `username` and `password_hash`
- [ ] Username must be unique — `DuplicateResourceException` (HTTP 409) on create/update
- [ ] Password hashing — BCrypt, never store or log raw passwords
- [ ] Default password — first 3 lowercase letters of first name + last 3 digits of DNI
- [ ] JWT token — stateless auth with `sub`, `roles`, `permissions`, `iat`, `exp` claims; HMAC-SHA256 signed; 24h expiration
- [ ] JWT secret — provided via `JWT_SECRET` environment variable, never hardcoded
- [ ] Login error message — vague "Usuario y/o contraseña incorrectos" (HTTP 401), does not reveal which field is wrong
- [ ] Protected endpoints — all `/api/**` require auth except `/api/auth/**`
- [ ] Role-based access — `hasRole()` and `hasPermission()` in frontend, `@PreAuthorize` in backend (future)
- [ ] Token storage — `localStorage` key `autotech_token`, `Authorization: Bearer` header on requests
- [ ] 401 handling — clear token and redirect to `/login` on any 401 response
- [ ] Forgot password — deferred placeholder page

### 8.4 Testing

- [ ] `JwtServiceTest` — token generation, validation (valid/expired/wrong username), username extraction
- [ ] `AuthServiceImplTest` — login happy path, invalid credentials, getCurrentUser
- [ ] `CustomUserDetailsServiceTest` — loadByUsername happy path, unknown username, authorities include roles and permissions
- [ ] `AuthControllerTest` — `@WebMvcTest`: login 200, login 401, me 200, me 401 without token
- [ ] `AuthIntegrationTest` — `@SpringBootTest` + Testcontainers: full login flow (create employee → login → use token → verify 401 without token)
- [ ] `LoginPage.test.tsx` — renders fields, error on invalid creds, redirect on success, forgot password link
- [ ] `ForgotPasswordPage.test.tsx` — renders placeholder, back to login link
- [ ] `ProtectedRoute.test.tsx` — redirects when unauthenticated, renders children when authenticated, role/permission checks
- [ ] `AuthContext.test.tsx` — login stores token/user, logout clears, hasRole, hasPermission, session restore from localStorage
