package com.autotech.inspection.repository;

import com.autotech.inspection.model.InspectionItem;
import com.autotech.inspection.model.InspectionItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface InspectionItemRepository extends JpaRepository<InspectionItem, Long> {

    List<InspectionItem> findByInspectionId(Long inspectionId);

    @Query("""
            SELECT ti.name, COUNT(ii)
            FROM InspectionItem ii
            JOIN ii.inspection ins
            JOIN ii.templateItem ti
            JOIN ins.repairOrder ro
            JOIN ro.vehicle v
            WHERE ii.status IN :statuses
              AND ins.createdAt >= :start AND ins.createdAt < :end
              AND (:brandId IS NULL OR v.brand.id = :brandId)
            GROUP BY ti.name
            ORDER BY COUNT(ii) DESC
            """)
    List<Object[]> countFaultsByPeriodAndBrand(
            @Param("statuses") Collection<InspectionItemStatus> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("brandId") Long brandId);
}
