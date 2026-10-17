package com.autotech.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
@ConfigurationProperties(prefix = "autotech.app")
public class AppProperties {

    private String publicUrl = "http://localhost:3000";
    private String timeZone = "America/Argentina/Cordoba";

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    /**
     * Builds an absolute frontend URL for links sent by email.
     */
    public String publicLink(String path) {
        String base = publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
        return base + (path.startsWith("/") ? path : "/" + path);
    }

    /**
     * Current wall-clock time of the workshop. Appointment times are stored as workshop local time,
     * while audit timestamps (created_at, etc.) use the JVM default zone (UTC).
     */
    public LocalDateTime workshopNow() {
        return LocalDateTime.now(ZoneId.of(timeZone));
    }
}
