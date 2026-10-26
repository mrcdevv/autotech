package com.autotech.stock.repository;

import com.autotech.stock.model.StockMovement;
import com.autotech.stock.model.StockSourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @EntityGraph(attributePaths = {"product"})
    List<StockMovement> findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType sourceType, Long sourceId);

    @EntityGraph(attributePaths = {"createdBy"})
    Page<StockMovement> findByProductId(Long productId, Pageable pageable);
}
