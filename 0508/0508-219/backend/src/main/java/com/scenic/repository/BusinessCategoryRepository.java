package com.scenic.repository;

import com.scenic.entity.BusinessCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessCategoryRepository extends JpaRepository<BusinessCategory, Long>, JpaSpecificationExecutor<BusinessCategory> {

    Optional<BusinessCategory> findByCategoryCode(String categoryCode);

    Optional<BusinessCategory> findByCategoryName(String categoryName);

    List<BusinessCategory> findByStatus(Boolean status);

    boolean existsByCategoryCode(String categoryCode);

    boolean existsByCategoryName(String categoryName);
}
