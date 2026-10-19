package com.autotech.tax.service;

import com.autotech.tax.dto.TaxConfigRequest;
import com.autotech.tax.model.TaxConfig;
import com.autotech.tax.repository.TaxConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaxConfigServiceImpl implements TaxConfigService {

    private static final BigDecimal DEFAULT_TAX_PERCENTAGE = BigDecimal.valueOf(21);

    private final TaxConfigRepository taxConfigRepository;

    @Override
    @Transactional(readOnly = true)
    public TaxConfig getConfig() {
        return getConfigInternal();
    }

    @Override
    @Transactional
    public TaxConfig updateConfig(TaxConfigRequest request) {
        TaxConfig config = getConfigInternal();
        config.setTaxPercentage(request.taxPercentage());
        return taxConfigRepository.save(config);
    }

    private TaxConfig getConfigInternal() {
        return taxConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> taxConfigRepository.save(
                        TaxConfig.builder().taxPercentage(DEFAULT_TAX_PERCENTAGE).build()));
    }
}
