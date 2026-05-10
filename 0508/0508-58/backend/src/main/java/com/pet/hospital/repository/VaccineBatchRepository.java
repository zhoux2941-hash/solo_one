package com.pet.hospital.repository;

import com.pet.hospital.entity.Vaccine;
import com.pet.hospital.entity.VaccineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VaccineBatchRepository extends JpaRepository<VaccineBatch, Long> {

    List<VaccineBatch> findByVaccineOrderByExpiryDateAsc(Vaccine vaccine);

    List<VaccineBatch> findByVaccineIdOrderByExpiryDateAsc(Long vaccineId);

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.vaccine = :vaccine AND vb.quantity > 0 ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findAvailableBatchesByVaccine(@Param("vaccine") Vaccine vaccine);

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.vaccine.id = :vaccineId AND vb.quantity > 0 ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findAvailableBatchesByVaccineId(@Param("vaccineId") Long vaccineId);

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.expiryDate >= :startDate AND vb.expiryDate <= :endDate AND vb.quantity > 0 ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findExpiringBatches(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    Optional<VaccineBatch> findByBatchNumber(String batchNumber);

    @Query("SELECT SUM(vb.quantity) FROM VaccineBatch vb WHERE vb.vaccine = :vaccine")
    Integer sumQuantityByVaccine(@Param("vaccine") Vaccine vaccine);

    @Query("SELECT SUM(vb.quantity) FROM VaccineBatch vb WHERE vb.vaccine.id = :vaccineId")
    Integer sumQuantityByVaccineId(@Param("vaccineId") Long vaccineId);

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.expiryDate < :today AND vb.quantity > 0 AND vb.isScrapped = false ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findExpiredBatches(@Param("today") LocalDate today);

    List<VaccineBatch> findByIdInAndIsScrappedFalse(List<Long> ids);
}
