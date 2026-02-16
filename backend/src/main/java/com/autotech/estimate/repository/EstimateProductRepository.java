package com.autotech.estimate.repository;

import com.autotech.estimate.model.EstimateProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstimateProductRepository extends JpaRepository<EstimateProduct, Long> {

    List<EstimateProduct> findByEstimateId(Long estimateId);

    void deleteByEstimateId(Long estimateId);
}
