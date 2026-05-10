package com.fishing.repository;

import com.fishing.entity.FishingSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FishingSpotRepository extends JpaRepository<FishingSpot, Long> {
    List<FishingSpot> findByUserId(Long userId);
}
