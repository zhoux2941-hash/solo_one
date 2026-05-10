package com.petclean.repository;

import com.petclean.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {

    List<Building> findAllByOrderByTotalPointsDesc();

    @Query("SELECT b FROM Building b ORDER BY b.totalPoints DESC")
    List<Building> findAllOrderedByPoints();
}
