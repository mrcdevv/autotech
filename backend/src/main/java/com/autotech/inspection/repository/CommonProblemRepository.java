package com.autotech.inspection.repository;

import com.autotech.inspection.model.CommonProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommonProblemRepository extends JpaRepository<CommonProblem, Long> {

    List<CommonProblem> findAllByOrderByDescriptionAsc();
}
