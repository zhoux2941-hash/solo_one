package com.healthcare.repository;

import com.healthcare.entity.DietaryRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DietaryRestrictionRepository extends JpaRepository<DietaryRestriction, Long>, JpaSpecificationExecutor<DietaryRestriction> {
    boolean existsByRestrictionCode(String restrictionCode);
    boolean existsByRestrictionCodeAndIdNot(String restrictionCode, Long id);
    List<DietaryRestriction> findByStatusOrderByIdAsc(Integer status);
}
