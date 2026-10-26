package com.autotech.tax.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.tax.dto.TaxConfigRequest;
import com.autotech.tax.dto.TaxConfigResponse;
import com.autotech.tax.model.TaxConfig;
import com.autotech.tax.service.TaxConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxConfigControllerTest {

    @Mock
    private TaxConfigService taxConfigService;

    @InjectMocks
    private TaxConfigController taxConfigController;

    @Test
    void givenConfig_whenGetConfig_thenReturnOkWithResponse() {
        // Arrange
        TaxConfig config = buildConfig(1L, BigDecimal.valueOf(21));
        when(taxConfigService.getConfig()).thenReturn(config);

        // Act
        ResponseEntity<ApiResponse<TaxConfigResponse>> result = taxConfigController.getConfig();

        // Assert
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().getStatus()).isEqualTo("success");
        assertThat(result.getBody().getData().id()).isEqualTo(1L);
        assertThat(result.getBody().getData().taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenReturnOkWithResponse() {
        // Arrange
        TaxConfigRequest request = new TaxConfigRequest(BigDecimal.valueOf(10));
        TaxConfig config = buildConfig(1L, BigDecimal.valueOf(10));
        when(taxConfigService.updateConfig(request)).thenReturn(config);

        // Act
        ResponseEntity<ApiResponse<TaxConfigResponse>> result = taxConfigController.updateConfig(request);

        // Assert
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().getStatus()).isEqualTo("success");
        assertThat(result.getBody().getData().taxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        verify(taxConfigService).updateConfig(request);
    }

    private TaxConfig buildConfig(Long id, BigDecimal taxPercentage) {
        TaxConfig config = TaxConfig.builder().taxPercentage(taxPercentage).build();
        config.setId(id);
        config.setCreatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
        config.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
        return config;
    }
}
