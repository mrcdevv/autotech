package com.autotech.tax.service;

import com.autotech.tax.dto.TaxConfigRequest;
import com.autotech.tax.model.TaxConfig;

public interface TaxConfigService {

    TaxConfig getConfig();

    TaxConfig updateConfig(TaxConfigRequest request);
}
