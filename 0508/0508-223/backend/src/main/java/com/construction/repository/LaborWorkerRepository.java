package com.construction.repository;

import com.construction.entity.LaborWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaborWorkerRepository extends JpaRepository<LaborWorker, Long>, JpaSpecificationExecutor<LaborWorker> {

    List<LaborWorker> findByProjectIdAndStatus(Long projectId, Integer status);

    boolean existsByIdCard(String idCard);

    boolean existsByIdCardAndIdNot(String idCard, Long id);
}
