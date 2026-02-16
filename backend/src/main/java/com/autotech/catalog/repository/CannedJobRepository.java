package com.autotech.catalog.repository;

import com.autotech.catalog.model.CannedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CannedJobRepository extends JpaRepository<CannedJob, Long> {

    Page<CannedJob> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String title, String description, Pageable pageable);

    @EntityGraph(attributePaths = {"services", "products"})
    Optional<CannedJob> findWithDetailsById(Long id);
}
