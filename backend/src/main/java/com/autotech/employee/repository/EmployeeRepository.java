package com.autotech.employee.repository;

import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByDni(String dni);

    boolean existsByDniAndIdNot(String dni, Long id);

    Optional<Employee> findByDni(String dni);

    @EntityGraph(attributePaths = {"roles"})
    Optional<Employee> findWithRolesById(Long id);

    Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.dni) LIKE LOWER(CONCAT('%', :dni, '%'))")
    Page<Employee> searchByDni(@Param("dni") String dni, Pageable pageable);

    @Query("""
        SELECT DISTINCT e FROM Employee e
        JOIN e.roles r
        WHERE r.id = :roleId
    """)
    Page<Employee> findByRoleId(@Param("roleId") Long roleId, Pageable pageable);

    @EntityGraph(attributePaths = {"roles"})
    Page<Employee> findAll(Pageable pageable);
}
