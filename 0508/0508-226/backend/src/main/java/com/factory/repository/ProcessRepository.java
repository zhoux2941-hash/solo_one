package com.factory.repository;

import com.factory.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {
    Optional<Process> findByProcessCode(String processCode);
    boolean existsByProcessCode(String processCode);
    List<Process> findByProcessRouteIdOrderBySequence(Long routeId);
    void deleteByProcessRouteId(Long routeId);
}