package com.flower.preservative.repository;

import com.flower.preservative.entity.CustomFormula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFormulaRepository extends JpaRepository<CustomFormula, Long> {
    List<CustomFormula> findBySessionId(String sessionId);
    
    List<CustomFormula> findByUserId(Long userId);
    
    Optional<CustomFormula> findBySessionIdAndFormulaCode(String sessionId, String formulaCode);
    
    Optional<CustomFormula> findByUserIdAndFormulaCode(Long userId, String formulaCode);
    
    void deleteByExpiresAtBefore(LocalDateTime now);
}
