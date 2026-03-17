package com.autotech.inspection.repository;

import com.autotech.inspection.model.InspectionTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long> {

    @EntityGraph(attributePaths = {"groups", "groups.items"})
    Optional<InspectionTemplate> findWithGroupsAndItemsById(Long id);

    List<InspectionTemplate> findAllByOrderByTitleAsc();
}
