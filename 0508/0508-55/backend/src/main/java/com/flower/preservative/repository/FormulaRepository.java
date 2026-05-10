package com.flower.preservative.repository;

import com.flower.preservative.entity.Formula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FormulaRepository extends JpaRepository<Formula, Long> {
    Optional<Formula> findByFormulaCode(String formulaCode);
}
