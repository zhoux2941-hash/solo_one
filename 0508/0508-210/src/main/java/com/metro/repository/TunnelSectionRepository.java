package com.metro.repository;

import com.metro.entity.TunnelSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TunnelSectionRepository extends JpaRepository<TunnelSection, Long> {
    Optional<TunnelSection> findBySectionId(String sectionId);
    boolean existsBySectionId(String sectionId);
}
