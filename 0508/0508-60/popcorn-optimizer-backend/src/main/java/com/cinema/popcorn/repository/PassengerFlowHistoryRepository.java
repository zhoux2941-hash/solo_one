package com.cinema.popcorn.repository;

import com.cinema.popcorn.entity.PassengerFlowHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PassengerFlowHistoryRepository extends JpaRepository<PassengerFlowHistory, Long> {
    
    List<PassengerFlowHistory> findByRecordDateOrderByHourOfDayAsc(LocalDate date);
    
    List<PassengerFlowHistory> findByRecordDateBetweenOrderByRecordDateDesc(LocalDate start, LocalDate end);
    
    @Query("SELECT AVG(p.passengerCount) FROM PassengerFlowHistory p WHERE p.hourOfDay = :hour AND p.dayOfWeek = :dayOfWeek")
    Double findAveragePassengerCountByHourAndDay(@Param("hour") int hour, @Param("dayOfWeek") int dayOfWeek);
    
    @Query("SELECT p FROM PassengerFlowHistory p WHERE p.recordDate = :date AND p.hourOfDay BETWEEN :startHour AND :endHour ORDER BY p.hourOfDay")
    List<PassengerFlowHistory> findByDateAndHourRange(@Param("date") LocalDate date, 
                                                        @Param("startHour") int startHour, 
                                                        @Param("endHour") int endHour);
}
