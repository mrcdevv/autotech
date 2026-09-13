package com.autotech.inspection.repository;

import com.autotech.inspection.model.InspectionTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionTemplateItemRepository extends JpaRepository<InspectionTemplateItem, Long> {

    List<InspectionTemplateItem> findByGroupIdOrderBySortOrderAsc(Long groupId);

    @Query("SELECT COALESCE(MAX(i.sortOrder), -1) + 1 FROM InspectionTemplateItem i WHERE i.group.id = :groupId")
    Integer findNextSortOrder(@Param("groupId") Long groupId);
}
