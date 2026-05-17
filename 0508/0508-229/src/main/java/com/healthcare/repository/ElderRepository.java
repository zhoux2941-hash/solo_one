package com.healthcare.repository;

import com.healthcare.entity.Elder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElderRepository extends JpaRepository<Elder, Long>, JpaSpecificationExecutor<Elder> {
    boolean existsByElderNo(String elderNo);
    boolean existsByElderNoAndIdNot(String elderNo, Long id);
    List<Elder> findByBedId(Long bedId);
}
