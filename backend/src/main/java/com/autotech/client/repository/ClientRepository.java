package com.autotech.client.repository;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

// import org.springframework.data.jpa.repository.EntityGraph;
// import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByDni(String dni);

    Page<Client> findByClientType(ClientType clientType, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE LOWER(c.dni) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Client> findByDniContaining(@Param("query") String query, Pageable pageable);

    @Query("""
                SELECT c FROM Client c
                WHERE LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(c.dni) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Client> search(@Param("query") String query, Pageable pageable);

    /*
     * @EntityGraph(attributePaths = {"vehicles"})
     * Optional<Client> findWithVehiclesById(Long id);
     */
}
