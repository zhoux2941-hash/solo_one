package com.traffic.violation.repository;

import com.traffic.violation.entity.Violation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {

    List<Violation> findByPlateNumberOrderByViolationTimeDesc(String plateNumber);

    List<Violation> findByPlateNumberAndStatusOrderByViolationTimeDesc(String plateNumber, String status);

    Page<Violation> findAllByOrderByViolationTimeDesc(Pageable pageable);

    Page<Violation> findByPlateNumberOrderByViolationTimeDesc(String plateNumber, Pageable pageable);

    @Query("SELECT COUNT(v) > 0 FROM Violation v WHERE v.plateNumber = :plateNumber AND v.location = :location AND v.violationTime >= :startTime")
    boolean existsDuplicateViolation(@Param("plateNumber") String plateNumber, @Param("location") String location, @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COALESCE(SUM(v.points), 0) FROM Violation v WHERE v.plateNumber = :plateNumber AND v.status = 'UNPAID'")
    Integer sumUnpaidPointsByPlateNumber(@Param("plateNumber") String plateNumber);

    @Query("SELECT COALESCE(SUM(v.points), 0) FROM Violation v WHERE v.plateNumber = :plateNumber")
    Integer sumTotalPointsByPlateNumber(@Param("plateNumber") String plateNumber);
}
