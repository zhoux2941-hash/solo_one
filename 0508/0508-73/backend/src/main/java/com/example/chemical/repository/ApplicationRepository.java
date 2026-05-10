package com.example.chemical.repository;

import com.example.chemical.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByApplicantIdOrderByCreatedAtDesc(Long applicantId);
    List<Application> findByStatusOrderByCreatedAtDesc(Application.ApplicationStatus status);
    
    @Query("SELECT a FROM Application a WHERE a.status = :status ORDER BY a.createdAt DESC")
    List<Application> findByStatus(@Param("status") Application.ApplicationStatus status);
    
    List<Application> findByStatusInOrderByCreatedAtDesc(List<Application.ApplicationStatus> statuses);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Application a WHERE a.id = :id")
    Optional<Application> findByIdWithLock(@Param("id") Long id);
}
