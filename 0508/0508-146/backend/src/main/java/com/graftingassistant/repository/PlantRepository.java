package com.graftingassistant.repository;

import com.graftingassistant.entity.Plant;
import com.graftingassistant.entity.Plant.PlantType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<Plant, Long> {
    
    List<Plant> findByTypeIn(List<PlantType> types);
    
    List<Plant> findByType(PlantType type);
}
