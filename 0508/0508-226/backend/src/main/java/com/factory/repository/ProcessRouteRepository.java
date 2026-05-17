package com.factory.repository;

import com.factory.entity.ProcessRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessRouteRepository extends JpaRepository<ProcessRoute, Long> {
    Optional<ProcessRoute> findByRouteCode(String routeCode);
    boolean existsByRouteCode(String routeCode);
    Page<ProcessRoute> findByRouteNameContaining(String routeName, Pageable pageable);
    Page<ProcessRoute> findByMaterialId(Long materialId, Pageable pageable);
}