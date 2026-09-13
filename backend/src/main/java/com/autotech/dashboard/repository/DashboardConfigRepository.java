package com.autotech.dashboard.repository;

import com.autotech.dashboard.model.DashboardConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DashboardConfigRepository extends JpaRepository<DashboardConfig, Long> {
}
