package com.flower.preservative.repository;

import com.flower.preservative.entity.FlowerFormulaMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlowerFormulaMappingRepository extends JpaRepository<FlowerFormulaMapping, Long> {
    List<FlowerFormulaMapping> findByFlowerType(String flowerType);
    
    List<FlowerFormulaMapping> findByFlowerTypeAndFormulaCode(String flowerType, String formulaCode);
}
