package com.graftingassistant.repository;

import com.graftingassistant.entity.GraftingReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GraftingReminderRepository extends JpaRepository<GraftingReminder, Long> {
    
    List<GraftingReminder> findByGraftingRecordIdOrderByScheduledDateAsc(Long recordId);
    
    List<GraftingReminder> findByScheduledDateLessThanEqualAndIsCompletedFalseAndIsDismissedFalse(LocalDate date);
    
    List<GraftingReminder> findByScheduledDateBetweenAndIsCompletedFalse(LocalDate start, LocalDate end);
    
    @Query("SELECT gr FROM GraftingReminder gr " +
           "WHERE gr.graftingRecord.id = :recordId " +
           "AND gr.isCompleted = false " +
           "AND gr.isDismissed = false " +
           "ORDER BY gr.scheduledDate ASC")
    List<GraftingReminder> findPendingByRecordId(Long recordId);
}
