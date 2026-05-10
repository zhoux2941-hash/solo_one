package com.graftingassistant.service;

import com.graftingassistant.entity.*;
import com.graftingassistant.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderService {
    
    private final PhenologyStageRepository stageRepository;
    private final CareReminderRepository careReminderRepository;
    private final GraftingReminderRepository graftingReminderRepository;
    private final GraftingRecordRepository recordRepository;
    
    private static final int MAX_GENERATION_DAYS = 120;
    
    @Cacheable(value = "phenology_stages")
    public List<PhenologyStage> getAllStages() {
        return stageRepository.findAllByOrderByStageOrderAsc();
    }
    
    @Cacheable(value = "care_reminders")
    public List<CareReminder> getAllCareReminders() {
        return careReminderRepository.findAllByOrderByIdAsc();
    }
    
    @Transactional
    public List<GraftingReminder> generateRemindersForRecord(Long recordId) {
        GraftingRecord record = recordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("Grafting record not found"));
        
        List<GraftingReminder> existingReminders = 
            graftingReminderRepository.findByGraftingRecordIdOrderByScheduledDateAsc(recordId);
        
        if (!existingReminders.isEmpty()) {
            return existingReminders;
        }
        
        List<PhenologyStage> stages = getAllStages();
        List<GraftingReminder> generatedReminders = new ArrayList<>();
        
        for (PhenologyStage stage : stages) {
            List<CareReminder> careReminders = careReminderRepository.findByStageIdOrderByDaysOffsetAsc(stage.getId());
            
            for (CareReminder careReminder : careReminders) {
                LocalDate stageStartDate = record.getGraftingDate().plusDays(stage.getDaysAfterGrafting());
                LocalDate reminderDate = stageStartDate.plusDays(careReminder.getDaysOffset());
                
                if (careReminder.getIsRepeatable() && careReminder.getRepeatIntervalDays() != null) {
                    LocalDate stageEndDate = stageStartDate.plusDays(stage.getDurationDays());
                    
                    while (!reminderDate.isAfter(stageEndDate)) {
                        GraftingReminder graftingReminder = createGraftingReminder(record, careReminder, reminderDate);
                        generatedReminders.add(graftingReminder);
                        
                        reminderDate = reminderDate.plusDays(careReminder.getRepeatIntervalDays());
                    }
                } else {
                    GraftingReminder graftingReminder = createGraftingReminder(record, careReminder, reminderDate);
                    generatedReminders.add(graftingReminder);
                }
            }
        }
        
        return graftingReminderRepository.saveAll(generatedReminders);
    }
    
    private GraftingReminder createGraftingReminder(GraftingRecord record, CareReminder careReminder, LocalDate scheduledDate) {
        GraftingReminder reminder = new GraftingReminder();
        reminder.setGraftingRecord(record);
        reminder.setCareReminder(careReminder);
        reminder.setScheduledDate(scheduledDate);
        reminder.setIsCompleted(false);
        reminder.setIsDismissed(false);
        return reminder;
    }
    
    @Transactional
    public GraftingReminder completeReminder(Long reminderId, String notes) {
        GraftingReminder reminder = graftingReminderRepository.findById(reminderId)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        
        reminder.setIsCompleted(true);
        reminder.setCompletedDate(LocalDate.now());
        if (notes != null) {
            reminder.setNotes(notes);
        }
        
        return graftingReminderRepository.save(reminder);
    }
    
    @Transactional
    public GraftingReminder dismissReminder(Long reminderId) {
        GraftingReminder reminder = graftingReminderRepository.findById(reminderId)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        
        reminder.setIsDismissed(true);
        
        return graftingReminderRepository.save(reminder);
    }
    
    public List<GraftingReminder> getRemindersByRecord(Long recordId) {
        return graftingReminderRepository.findByGraftingRecordIdOrderByScheduledDateAsc(recordId);
    }
    
    public List<GraftingReminder> getPendingRemindersByRecord(Long recordId) {
        return graftingReminderRepository.findPendingByRecordId(recordId);
    }
    
    public List<GraftingReminder> getTodayReminders() {
        return graftingReminderRepository.findByScheduledDateLessThanEqualAndIsCompletedFalseAndIsDismissedFalse(LocalDate.now());
    }
    
    public List<GraftingReminder> getUpcomingReminders(int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        return graftingReminderRepository.findByScheduledDateBetweenAndIsCompletedFalse(today, endDate);
    }
    
    public String getCurrentStageName(LocalDate graftingDate) {
        List<PhenologyStage> stages = getAllStages();
        long daysSinceGrafting = ChronoUnit.DAYS.between(graftingDate, LocalDate.now());
        
        for (int i = stages.size() - 1; i >= 0; i--) {
            PhenologyStage stage = stages.get(i);
            if (daysSinceGrafting >= stage.getDaysAfterGrafting()) {
                return stage.getName();
            }
        }
        
        return "未进入物候期";
    }
}
