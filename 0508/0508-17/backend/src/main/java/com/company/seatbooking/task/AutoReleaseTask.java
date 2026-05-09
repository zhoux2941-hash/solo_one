package com.company.seatbooking.task;

import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.service.CheckInService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AutoReleaseTask {
    
    private static final Logger logger = LoggerFactory.getLogger(AutoReleaseTask.class);
    
    private final CheckInService checkInService;
    
    public AutoReleaseTask(CheckInService checkInService) {
        this.checkInService = checkInService;
    }
    
    @Scheduled(fixedRate = 60000)
    public void checkAndReleaseOverdueBookings() {
        logger.debug("开始执行自动释放定时任务");
        
        List<Booking> uncheckedBookings = checkInService.getTodayUncheckedInBookings();
        int releasedCount = 0;
        
        for (Booking booking : uncheckedBookings) {
            if (checkInService.isOverdueForCheckIn(booking)) {
                try {
                    checkInService.autoReleaseBooking(booking);
                    releasedCount++;
                } catch (Exception e) {
                    logger.error("自动释放预订失败: bookingId={}", booking.getBookingId(), e);
                }
            }
        }
        
        if (releasedCount > 0) {
            logger.info("自动释放任务完成: 共扫描{}个未签到预订，释放{}个", 
                       uncheckedBookings.size(), releasedCount);
        }
    }
}
