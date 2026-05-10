package com.office.plantreminder.repository;

import com.office.plantreminder.entity.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<Plant, Long> {
    @Query("SELECT p FROM Plant p WHERE p.nextWateringDate < :today OR (p.nextWateringDate IS NULL AND p.createdAt < :threshold)")
    List<Plant> findOverduePlants(LocalDate today, LocalDate threshold);
}
