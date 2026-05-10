package com.graftingassistant.service;

import com.graftingassistant.entity.GraftingReminder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderSchedulerService {
    
    private final ReminderService reminderService;
    
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkDailyReminders() {
        log.info("开始检查今日嫁接管理提醒...");
        
        List<GraftingReminder> todayReminders = reminderService.getTodayReminders();
        
        if (todayReminders.isEmpty()) {
            log.info("今日无待处理的嫁接管理提醒");
            return;
        }
        
        log.info("今日有 {} 条待处理的嫁接管理提醒", todayReminders.size());
        
        for (GraftingReminder reminder : todayReminders) {
            logReminderDetails(reminder);
        }
    }
    
    private void logReminderDetails(GraftingReminder reminder) {
        String priority = reminder.getCareReminder().getPriority().name();
        String type = reminder.getCareReminder().getType().name();
        String title = reminder.getCareReminder().getTitle();
        String rootstock = reminder.getGraftingRecord().getRootstock().getName();
        String scion = reminder.getGraftingRecord().getScion().getName();
        
        log.info("[{}] [{}] {} - {} x {}", priority, type, title, rootstock, scion);
    }
}
