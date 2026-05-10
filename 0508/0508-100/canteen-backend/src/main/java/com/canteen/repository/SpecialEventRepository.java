package com.canteen.repository;

import com.canteen.entity.SpecialEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SpecialEventRepository extends JpaRepository<SpecialEvent, Long> {
    List<SpecialEvent> findByEventDateBetweenOrderByEventDateAsc(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT e FROM SpecialEvent e WHERE e.eventDate >= :startDate ORDER BY e.eventDate ASC")
    List<SpecialEvent> findRecentEvents(@Param("startDate") LocalDate startDate);
    
    List<SpecialEvent> findAllByOrderByEventDateDesc();
    
    void deleteByEventDateAndEventType(LocalDate eventDate, String eventType);
}
