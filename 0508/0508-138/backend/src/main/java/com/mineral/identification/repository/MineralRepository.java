package com.mineral.identification.repository;

import com.mineral.identification.entity.Mineral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MineralRepository extends JpaRepository<Mineral, Long> {
    
    @Query("SELECT m FROM Mineral m JOIN FETCH m.features")
    List<Mineral> findAllWithFeatures();
    
    @Query("SELECT m FROM Mineral m JOIN FETCH m.features WHERE m.id = :id")
    Mineral findByIdWithFeatures(@Param("id") Long id);
}
