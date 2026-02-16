package com.autotech.catalog.repository;

import com.autotech.catalog.model.CannedJobService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CannedJobServiceRepository extends JpaRepository<CannedJobService, Long> {

    List<CannedJobService> findByCannedJobId(Long cannedJobId);

    void deleteByCannedJobId(Long cannedJobId);
}
