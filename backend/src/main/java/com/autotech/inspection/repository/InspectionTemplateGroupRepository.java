package com.autotech.inspection.repository;

import com.autotech.inspection.model.InspectionTemplateGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionTemplateGroupRepository extends JpaRepository<InspectionTemplateGroup, Long> {

    List<InspectionTemplateGroup> findByTemplateIdOrderBySortOrderAsc(Long templateId);

    @Query("SELECT COALESCE(MAX(g.sortOrder), -1) + 1 FROM InspectionTemplateGroup g WHERE g.template.id = :templateId")
    Integer findNextSortOrder(@Param("templateId") Long templateId);
}
