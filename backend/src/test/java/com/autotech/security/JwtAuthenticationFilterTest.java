package com.autotech.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String TOKEN = "token";
    private static final String EMAIL = "empleado@autotech.com";

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(tokenProvider, customUserDetailsService, new ObjectMapper());
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void givenValidTokenForActiveEmployee_whenFilter_thenAuthenticateWithPermissions() throws Exception {
        // Arrange
        stubEmployee(true, false);
        MockHttpServletRequest request = requestTo("/api/clients");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("read_client");
    }

    @Test
    void givenEmployeeMustChangePassword_whenCallBusinessEndpoint_thenReturn403PasswordChangeRequired() throws Exception {
        // Arrange
        stubEmployee(true, true);
        MockHttpServletRequest request = requestTo("/api/clients");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString())
                .contains("\"code\":\"PASSWORD_CHANGE_REQUIRED\"")
                .contains("\"status\":\"error\"");
    }

    @Test
    void givenEmployeeMustChangePassword_whenCallAuthEndpoint_thenContinueAuthenticated() throws Exception {
        // Arrange
        stubEmployee(true, true);
        MockHttpServletRequest request = requestTo("/api/auth/change-password");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @Test
    void givenDisabledEmployee_whenFilter_thenContinueUnauthenticated() throws Exception {
        // Arrange
        stubEmployee(false, false);
        MockHttpServletRequest request = requestTo("/api/clients");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void givenTokenOfDeletedEmployee_whenFilter_thenContinueUnauthenticated() throws Exception {
        // Arrange
        when(tokenProvider.validateToken(TOKEN)).thenReturn(true);
        when(tokenProvider.getUsernameFromJWT(TOKEN)).thenReturn(EMAIL);
        when(customUserDetailsService.loadUserByUsername(EMAIL)).thenThrow(new UsernameNotFoundException(EMAIL));
        MockHttpServletRequest request = requestTo("/api/clients");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private void stubEmployee(boolean enabled, boolean mustChangePassword) {
        when(tokenProvider.validateToken(TOKEN)).thenReturn(true);
        when(tokenProvider.getUsernameFromJWT(TOKEN)).thenReturn(EMAIL);
        when(customUserDetailsService.loadUserByUsername(EMAIL)).thenReturn(new AuthenticatedEmployee(
                EMAIL, "encoded", enabled, mustChangePassword, List.of(new SimpleGrantedAuthority("read_client"))));
    }

    private MockHttpServletRequest requestTo(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.addHeader("Authorization", "Bearer " + TOKEN);
        return request;
    }
}
