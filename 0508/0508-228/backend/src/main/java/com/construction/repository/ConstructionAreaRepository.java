package com.construction.repository;

import com.construction.entity.ConstructionArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConstructionAreaRepository extends JpaRepository<ConstructionArea, Long>, JpaSpecificationExecutor<ConstructionArea> {

    List<ConstructionArea> findByProjectId(Long projectId);

    boolean existsByAreaNameAndProjectId(String areaName, Long projectId);

    boolean existsByAreaNameAndProjectIdAndIdNot(String areaName, Long projectId, Long id);
}
