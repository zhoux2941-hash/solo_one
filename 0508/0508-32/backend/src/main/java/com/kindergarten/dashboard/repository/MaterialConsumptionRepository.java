package com.kindergarten.dashboard.repository;

import com.kindergarten.dashboard.model.MaterialConsumption;
import com.kindergarten.dashboard.model.MaterialType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaterialConsumptionRepository extends JpaRepository<MaterialConsumption, Long> {

    List<MaterialConsumption> findByConsumptionDateBetweenOrderByConsumptionDateAsc(
            LocalDate startDate, LocalDate endDate);

    List<MaterialConsumption> findByMaterialTypeAndConsumptionDateBetweenOrderByConsumptionDateAsc(
            MaterialType materialType, LocalDate startDate, LocalDate endDate);

    @Query("SELECT m.materialType, SUM(m.amount) FROM MaterialConsumption m " +
           "WHERE m.consumptionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY m.materialType")
    List<Object[]> findTotalConsumptionByMaterial(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
