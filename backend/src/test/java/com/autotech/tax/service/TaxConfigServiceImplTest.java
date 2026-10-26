package com.autotech.tax.service;

import com.autotech.tax.dto.TaxConfigRequest;
import com.autotech.tax.model.TaxConfig;
import com.autotech.tax.repository.TaxConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxConfigServiceImplTest {

    @Mock
    private TaxConfigRepository taxConfigRepository;

    @InjectMocks
    private TaxConfigServiceImpl taxConfigService;

    @Test
    void givenExistingConfig_whenGetConfig_thenReturnConfig() {
        // Arrange
        TaxConfig config = buildConfig(BigDecimal.valueOf(21));
        when(taxConfigRepository.findAll()).thenReturn(List.of(config));

        // Act
        TaxConfig result = taxConfigService.getConfig();

        // Assert
        assertThat(result.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
    }

    @Test
    void givenNoConfig_whenGetConfig_thenCreateDefault21() {
        // Arrange
        TaxConfig defaultConfig = buildConfig(BigDecimal.valueOf(21));
        when(taxConfigRepository.findAll()).thenReturn(Collections.emptyList());
        when(taxConfigRepository.save(any(TaxConfig.class))).thenReturn(defaultConfig);

        // Act
        TaxConfig result = taxConfigService.getConfig();

        // Assert
        assertThat(result.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(21));
        verify(taxConfigRepository).save(any(TaxConfig.class));
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenPersistNewValue() {
        // Arrange
        TaxConfig config = buildConfig(BigDecimal.valueOf(21));
        when(taxConfigRepository.findAll()).thenReturn(List.of(config));
        when(taxConfigRepository.save(config)).thenReturn(config);

        // Act
        TaxConfig result = taxConfigService.updateConfig(new TaxConfigRequest(BigDecimal.valueOf(10)));

        // Assert
        assertThat(result.getTaxPercentage()).isEqualByComparingTo(BigDecimal.valueOf(10));
        verify(taxConfigRepository).save(config);
    }

    private TaxConfig buildConfig(BigDecimal taxPercentage) {
        TaxConfig config = TaxConfig.builder().taxPercentage(taxPercentage).build();
        config.setId(1L);
        return config;
    }
}
