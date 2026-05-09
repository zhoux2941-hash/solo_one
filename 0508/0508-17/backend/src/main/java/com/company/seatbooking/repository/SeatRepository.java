package com.company.seatbooking.repository;

import com.company.seatbooking.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    
    List<Seat> findByArea(String area);
    
    @Query("SELECT DISTINCT s.area FROM Seat s")
    List<String> findAllAreas();
    
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.area = ?1")
    Long countByArea(String area);
}
