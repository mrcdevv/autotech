package com.autotech.tax.repository;

import com.autotech.tax.model.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxConfigRepository extends JpaRepository<TaxConfig, Long> {
}
