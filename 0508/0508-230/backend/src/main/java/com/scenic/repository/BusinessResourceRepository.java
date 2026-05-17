package com.scenic.repository;

import com.scenic.entity.BusinessResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessResourceRepository extends JpaRepository<BusinessResource, Long>, JpaSpecificationExecutor<BusinessResource> {

    Optional<BusinessResource> findByResourceCode(String resourceCode);

    List<BusinessResource> findByCategoryId(Long categoryId);

    List<BusinessResource> findByStatus(String status);

    boolean existsByResourceCode(String resourceCode);

    boolean existsByResourceName(String resourceName);
}
