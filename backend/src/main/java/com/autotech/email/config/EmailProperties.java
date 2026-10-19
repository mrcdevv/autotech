package com.autotech.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "autotech.mail")
public class EmailProperties {

    private boolean enabled = false;
    private String from = "no-reply@autotech.com";
    private String workshopName = "Autotech";
    private String workshopAddress = "";
    private String workshopPhone = "";
    private String workshopMapsUrl = "";
    private String workshopContactUrl = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getWorkshopName() {
        return workshopName;
    }

    public void setWorkshopName(String workshopName) {
        this.workshopName = workshopName;
    }

    public String getWorkshopAddress() {
        return workshopAddress;
    }

    public void setWorkshopAddress(String workshopAddress) {
        this.workshopAddress = workshopAddress;
    }

    public String getWorkshopPhone() {
        return workshopPhone;
    }

    public void setWorkshopPhone(String workshopPhone) {
        this.workshopPhone = workshopPhone;
    }

    public String getWorkshopMapsUrl() {
        return workshopMapsUrl;
    }

    public void setWorkshopMapsUrl(String workshopMapsUrl) {
        this.workshopMapsUrl = workshopMapsUrl;
    }

    public String getWorkshopContactUrl() {
        return workshopContactUrl;
    }

    public void setWorkshopContactUrl(String workshopContactUrl) {
        this.workshopContactUrl = workshopContactUrl;
    }
}
