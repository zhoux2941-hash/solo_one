package com.tide.repository;

import com.tide.model.MoonPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MoonPhaseRepository extends JpaRepository<MoonPhase, Long> {
    
    Optional<MoonPhase> findByDate(LocalDate date);

    @Query("SELECT m FROM MoonPhase m WHERE m.date BETWEEN :start AND :end ORDER BY m.date")
    List<MoonPhase> findByDateRange(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}
