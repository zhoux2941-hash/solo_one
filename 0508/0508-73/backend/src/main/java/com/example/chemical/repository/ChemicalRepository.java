package com.example.chemical.repository;

import com.example.chemical.entity.Chemical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface ChemicalRepository extends JpaRepository<Chemical, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Chemical c WHERE c.id = :id")
    Optional<Chemical> findByIdWithLock(@Param("id") Long id);
}
