package com.factory.repository;

import com.factory.entity.Workshop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkshopRepository extends JpaRepository<Workshop, Long> {
    Optional<Workshop> findByWorkshopCode(String workshopCode);
    boolean existsByWorkshopCode(String workshopCode);
    Page<Workshop> findByWorkshopNameContaining(String workshopName, Pageable pageable);
}