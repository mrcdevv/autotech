package com.autotech.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * Authenticated principal: Spring's {@link User} plus the employee flags the
 * security filter needs on every request.
 */
@Getter
public class AuthenticatedEmployee extends User {

    private final boolean mustChangePassword;

    public AuthenticatedEmployee(String email,
                                 String password,
                                 boolean enabled,
                                 boolean mustChangePassword,
                                 Collection<? extends GrantedAuthority> authorities) {
        super(email, password, enabled, true, true, true, authorities);
        this.mustChangePassword = mustChangePassword;
    }
}
