package com.autotech.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret:defaultSecretKeyForDevelopmentLetItBeLongEnoughForHS512AndNotFailPlease1234567890qwertyuiopasdfghjklzxcvbnm}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-milliseconds:86400000}")
    private long jwtExpirationInMs;

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(expireDate)
                .signWith(key())
                .compact();
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(
                // Just ensuring the string is sufficiently encoded. In production, this should be an env varied base64 string.
                java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes())
        ));
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            // Never log the token itself; only why it was rejected
            log.warn("Invalid JWT rejected: {}", ex.getClass().getSimpleName());
            log.debug("Invalid JWT rejection details", ex);
        }
        return false;
    }
}
