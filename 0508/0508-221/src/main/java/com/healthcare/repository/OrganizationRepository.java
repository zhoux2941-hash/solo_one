package com.healthcare.repository;

import com.healthcare.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long>, JpaSpecificationExecutor<Organization> {
    List<Organization> findByParentId(Long parentId);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
}