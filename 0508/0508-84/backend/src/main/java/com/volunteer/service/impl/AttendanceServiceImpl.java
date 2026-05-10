package com.volunteer.service.impl;

import com.volunteer.entity.Attendance;
import com.volunteer.entity.TimeCoinRecord;
import com.volunteer.entity.User;
import com.volunteer.repository.AttendanceRepository;
import com.volunteer.repository.TimeCoinRecordRepository;
import com.volunteer.repository.UserRepository;
import com.volunteer.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeCoinRecordRepository timeCoinRecordRepository;

    @Override
    @Transactional
    public Attendance checkIn(Long userId, Long activityId) {
        Optional<Attendance> existingOpt = attendanceRepository
                .findByUserIdAndActivityIdAndCheckOutTimeIsNull(userId, activityId);
        if (existingOpt.isPresent()) {
            throw new RuntimeException("您已在该活动中签到，尚未签退");
        }
        
        Attendance attendance = new Attendance();
        attendance.setUserId(userId);
        attendance.setActivityId(activityId);
        attendance.setCheckInTime(LocalDateTime.now());
        attendance.setStatus("PENDING");
        return attendanceRepository.save(attendance);
    }

    @Override
    @Transactional
    public Attendance checkOut(Long userId, Long activityId) {
        Optional<Attendance> attendanceOpt = attendanceRepository
                .findByUserIdAndActivityIdAndCheckOutTimeIsNull(userId, activityId);
        if (!attendanceOpt.isPresent()) {
            throw new RuntimeException("未找到未签退的签到记录");
        }
        
        Attendance attendance = attendanceOpt.get();
        LocalDateTime checkInTime = attendance.getCheckInTime();
        LocalDateTime checkOutTime = LocalDateTime.now();
        attendance.setCheckOutTime(checkOutTime);
        
        long minutes = ChronoUnit.MINUTES.between(checkInTime, checkOutTime);
        attendance.setDurationMinutes((int) minutes);
        
        return attendanceRepository.save(attendance);
    }

    @Override
    public List<Attendance> findByUserId(Long userId) {
        return attendanceRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Override
    public List<Attendance> findByStatus(String status) {
        return attendanceRepository.findByStatusOrderByCreateTimeDesc(status);
    }

    @Override
    public List<Attendance> findPending() {
        return attendanceRepository.findByStatusOrderByCreateTimeDesc("PENDING");
    }

    @Override
    public List<Attendance> findUncheckedOut() {
        return attendanceRepository.findByCheckOutTimeIsNull();
    }

    @Override
    @Transactional
    public Attendance forceCheckOut(Long attendanceId, Long adminId, Integer customMinutes) {
        Optional<Attendance> attendanceOpt = attendanceRepository.findById(attendanceId);
        if (!attendanceOpt.isPresent()) {
            throw new RuntimeException("签到记录不存在");
        }
        
        Attendance attendance = attendanceOpt.get();
        if (attendance.getCheckOutTime() != null) {
            throw new RuntimeException("该记录已签退");
        }
        
        LocalDateTime checkInTime = attendance.getCheckInTime();
        LocalDateTime checkOutTime = LocalDateTime.now();
        
        int durationMinutes;
        if (customMinutes != null && customMinutes > 0) {
            durationMinutes = customMinutes;
        } else {
            long minutes = ChronoUnit.MINUTES.between(checkInTime, checkOutTime);
            durationMinutes = (int) (minutes > 0 ? minutes : 1);
        }
        
        attendance.setCheckOutTime(checkOutTime);
        attendance.setDurationMinutes(durationMinutes);
        
        return attendanceRepository.save(attendance);
    }

    @Override
    @Transactional
    public Attendance approve(Long attendanceId, Long adminId) {
        Optional<Attendance> attendanceOpt = attendanceRepository.findById(attendanceId);
        if (!attendanceOpt.isPresent()) {
            throw new RuntimeException("签到记录不存在");
        }
        
        Attendance attendance = attendanceOpt.get();
        if (!"PENDING".equals(attendance.getStatus())) {
            throw new RuntimeException("该记录已处理");
        }
        
        attendance.setStatus("APPROVED");
        attendance.setApprovedBy(adminId);
        attendance.setApprovedTime(LocalDateTime.now());
        
        User user = userRepository.findById(attendance.getUserId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Integer durationMinutes = attendance.getDurationMinutes();
        int hours = durationMinutes / 60;
        int timeCoins = hours * 10;
        
        if (timeCoins > 0) {
            int oldBalance = user.getTimeCoins();
            int newBalance = oldBalance + timeCoins;
            user.setTimeCoins(newBalance);
            userRepository.save(user);
            
            TimeCoinRecord record = new TimeCoinRecord();
            record.setUserId(user.getId());
            record.setType("EARN");
            record.setAmount(timeCoins);
            record.setBalance(newBalance);
            record.setSourceType("ATTENDANCE");
            record.setSourceId(attendanceId);
            record.setRemark("志愿服务奖励");
            timeCoinRecordRepository.save(record);
        }
        
        return attendanceRepository.save(attendance);
    }

    @Override
    @Transactional
    public Attendance reject(Long attendanceId, Long adminId) {
        Optional<Attendance> attendanceOpt = attendanceRepository.findById(attendanceId);
        if (!attendanceOpt.isPresent()) {
            throw new RuntimeException("签到记录不存在");
        }
        
        Attendance attendance = attendanceOpt.get();
        if (!"PENDING".equals(attendance.getStatus())) {
            throw new RuntimeException("该记录已处理");
        }
        
        attendance.setStatus("REJECTED");
        attendance.setApprovedBy(adminId);
        attendance.setApprovedTime(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    @Override
    public Integer getTotalApprovedMinutes(Long userId) {
        Integer total = attendanceRepository.sumApprovedDurationByUserId(userId);
        return total != null ? total : 0;
    }

    @Override
    public List<Object[]> getRanking() {
        return attendanceRepository.findTotalMinutesRanking();
    }
}
