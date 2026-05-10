package com.disaster.relief.repository;

import com.disaster.relief.entity.SupplyForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyForecastRepository extends JpaRepository<SupplyForecast, Long> {
    List<SupplyForecast> findByDisasterTypeOrderByCreatedAtDesc(String disasterType);
}
