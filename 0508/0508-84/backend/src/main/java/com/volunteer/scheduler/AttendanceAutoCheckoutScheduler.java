package com.volunteer.scheduler;

import com.volunteer.entity.Activity;
import com.volunteer.entity.Attendance;
import com.volunteer.repository.ActivityRepository;
import com.volunteer.repository.AttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Component
public class AttendanceAutoCheckoutScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceAutoCheckoutScheduler.class);

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void autoCheckoutByActivityEnd() {
        LocalDateTime now = LocalDateTime.now();
        List<Attendance> unclosedRecords = attendanceRepository.findUncheckedOutByActivityEnded(now);
        
        if (unclosedRecords.isEmpty()) {
            return;
        }
        
        logger.info("发现 {} 条活动结束后未签退的记录，开始自动签退", unclosedRecords.size());
        
        int count = 0;
        for (Attendance attendance : unclosedRecords) {
            try {
                Optional<Activity> activityOpt = activityRepository.findById(attendance.getActivityId());
                if (!activityOpt.isPresent()) {
                    continue;
                }
                
                Activity activity = activityOpt.get();
                LocalDateTime checkInTime = attendance.getCheckInTime();
                
                LocalDateTime checkoutTime;
                if (activity.getEndTime().isAfter(checkInTime)) {
                    checkoutTime = activity.getEndTime();
                } else {
                    checkoutTime = checkInTime.plusHours(1);
                }
                
                long minutes = ChronoUnit.MINUTES.between(checkInTime, checkoutTime);
                if (minutes <= 0) {
                    minutes = 1;
                }
                
                attendance.setCheckOutTime(checkoutTime);
                attendance.setDurationMinutes((int) minutes);
                attendanceRepository.save(attendance);
                
                logger.info("自动签退成功: userId={}, activityId={}, 时长={}分钟", 
                    attendance.getUserId(), attendance.getActivityId(), minutes);
                count++;
            } catch (Exception e) {
                logger.error("自动签退失败: attendanceId={}", attendance.getId(), e);
            }
        }
        
        logger.info("自动签退任务完成，共处理 {} 条记录", count);
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void autoCheckoutOverdue() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        List<Attendance> overdueRecords = 
            attendanceRepository.findByCheckOutTimeIsNullAndCheckInTimeBefore(cutoffTime);
        
        if (overdueRecords.isEmpty()) {
            return;
        }
        
        logger.info("发现 {} 条签到超过24小时未签退的记录，开始自动签退", overdueRecords.size());
        
        int count = 0;
        for (Attendance attendance : overdueRecords) {
            try {
                LocalDateTime checkInTime = attendance.getCheckInTime();
                LocalDateTime checkoutTime = checkInTime.plusHours(8);
                
                long minutes = ChronoUnit.MINUTES.between(checkInTime, checkoutTime);
                
                attendance.setCheckOutTime(checkoutTime);
                attendance.setDurationMinutes((int) minutes);
                attendanceRepository.save(attendance);
                
                logger.info("超时自动签退成功: userId={}, activityId={}, 时长={}分钟", 
                    attendance.getUserId(), attendance.getActivityId(), minutes);
                count++;
            } catch (Exception e) {
                logger.error("超时自动签退失败: attendanceId={}", attendance.getId(), e);
            }
        }
        
        logger.info("超时自动签退任务完成，共处理 {} 条记录", count);
    }
}
