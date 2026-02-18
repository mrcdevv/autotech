package com.autotech.estimate.repository;

import com.autotech.estimate.model.EstimateServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstimateServiceItemRepository extends JpaRepository<EstimateServiceItem, Long> {

    List<EstimateServiceItem> findByEstimateId(Long estimateId);

    void deleteByEstimateId(Long estimateId);
}
