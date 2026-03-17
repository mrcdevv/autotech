package com.autotech.inspection.repository;

import com.autotech.inspection.model.Inspection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    @EntityGraph(attributePaths = {"items", "items.templateItem", "items.templateItem.group", "template"})
    List<Inspection> findByRepairOrderId(Long repairOrderId);

    @EntityGraph(attributePaths = {"items", "items.templateItem", "items.templateItem.group", "template"})
    Optional<Inspection> findWithItemsById(Long id);
}
