package com.autotech.catalog.repository;

import com.autotech.catalog.model.CannedJobProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CannedJobProductRepository extends JpaRepository<CannedJobProduct, Long> {

    List<CannedJobProduct> findByCannedJobId(Long cannedJobId);

    void deleteByCannedJobId(Long cannedJobId);
}
