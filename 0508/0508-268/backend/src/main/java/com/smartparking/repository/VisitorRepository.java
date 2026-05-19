package com.smartparking.repository;

import com.smartparking.entity.Visitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    List<Visitor> findByPlateNumber(String plateNumber);

    List<Visitor> findByPhone(String phone);

    @Query("SELECT v FROM Visitor v WHERE v.entryTime >= :startTime AND v.entryTime < :endTime")
    List<Visitor> findByEntryTimeBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT v FROM Visitor v WHERE " +
           "(:name IS NULL OR v.name LIKE %:name%) AND " +
           "(:phone IS NULL OR v.phone LIKE %:phone%) AND " +
           "(:plateNumber IS NULL OR v.plateNumber LIKE %:plateNumber%) AND " +
           "(:status IS NULL OR v.status = :status)")
    Page<Visitor> findByConditions(
            @Param("name") String name,
            @Param("phone") String phone,
            @Param("plateNumber") String plateNumber,
            @Param("status") String status,
            Pageable pageable);

    List<Visitor> findByStatus(String status);

    @Query("SELECT COUNT(v) FROM Visitor v WHERE v.status = 'ACTIVE'")
    long countActiveVisitors();

    @Query("SELECT COUNT(v) FROM Visitor v WHERE v.createTime >= :startTime")
    long countTodayVisitors(@Param("startTime") LocalDateTime startTime);
}
