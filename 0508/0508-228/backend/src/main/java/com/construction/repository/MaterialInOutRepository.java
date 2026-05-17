package com.construction.repository;

import com.construction.entity.MaterialInOut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialInOutRepository extends JpaRepository<MaterialInOut, Long>, JpaSpecificationExecutor<MaterialInOut> {

    List<MaterialInOut> findByProjectId(Long projectId);

    List<MaterialInOut> findByMaterialId(Long materialId);

    boolean existsByBillNo(String billNo);
}
