package com.canteen.repository;

import com.canteen.entity.FoodWaste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FoodWasteRepository extends JpaRepository<FoodWaste, Long> {
    List<FoodWaste> findByRecordDateBetweenOrderByRecordDateAsc(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT f FROM FoodWaste f WHERE f.recordDate >= :startDate ORDER BY f.recordDate ASC")
    List<FoodWaste> findRecentData(@Param("startDate") LocalDate startDate);
    
    List<FoodWaste> findAllByOrderByRecordDateDesc();
}
