package com.property.maintenance.repository;

import com.property.maintenance.entity.Repairman;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairmanRepository extends JpaRepository<Repairman, Long> {
    List<Repairman> findByStatus(Integer status);
}
