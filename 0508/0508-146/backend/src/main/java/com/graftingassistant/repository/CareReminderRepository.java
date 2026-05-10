package com.graftingassistant.repository;

import com.graftingassistant.entity.CareReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareReminderRepository extends JpaRepository<CareReminder, Long> {
    
    List<CareReminder> findByStageIdOrderByDaysOffsetAsc(Long stageId);
    
    List<CareReminder> findAllByOrderByIdAsc();
}
