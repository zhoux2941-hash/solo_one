package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborAttendance;
import com.construction.entity.LaborWorker;
import com.construction.entity.LaborWorkHour;
import com.construction.repository.LaborAttendanceRepository;
import com.construction.repository.LaborWorkerRepository;
import com.construction.repository.LaborWorkHourRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LaborAttendanceService {

    @Resource
    private LaborAttendanceRepository laborAttendanceRepository;

    @Resource
    private LaborWorkerRepository laborWorkerRepository;

    @Resource
    private LaborWorkHourRepository laborWorkHourRepository;

    public Result<PageResult<LaborAttendance>> getAttendanceList(Integer pageNum, Integer pageSize, Long projectId, Long workerId, LocalDate startDate, LocalDate endDate) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "attendanceDate"));

        Specification<LaborAttendance> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (workerId != null) {
                predicates.add(criteriaBuilder.equal(root.get("workerId"), workerId));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("attendanceDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("attendanceDate"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<LaborAttendance> page = laborAttendanceRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<LaborAttendance> getAttendanceById(Long id) {
        LaborAttendance attendance = laborAttendanceRepository.findById(id).orElse(null);
        if (attendance == null) {
            return Result.error("考勤记录不存在");
        }
        return Result.success(attendance);
    }

    public Result<LaborAttendance> checkIn(Long workerId) {
        LaborWorker worker = laborWorkerRepository.findById(workerId).orElse(null);
        if (worker == null) {
            return Result.error("工人不存在");
        }

        LocalDate today = LocalDate.now();
        Optional<LaborAttendance> existing = laborAttendanceRepository.findByWorkerIdAndAttendanceDate(workerId, today);
        
        LaborAttendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            if (attendance.getCheckInTime() != null) {
                return Result.error("今日已签到");
            }
        } else {
            attendance = new LaborAttendance();
            attendance.setWorkerId(workerId);
            attendance.setProjectId(worker.getProjectId());
            attendance.setAttendanceDate(today);
            attendance.setAttendanceType("正常");
        }

        attendance.setCheckInTime(LocalDateTime.now());
        LaborAttendance saved = laborAttendanceRepository.save(attendance);
        return Result.success("签到成功", saved);
    }

    public Result<LaborAttendance> checkOut(Long workerId) {
        LocalDate today = LocalDate.now();
        LaborAttendance attendance = laborAttendanceRepository.findByWorkerIdAndAttendanceDate(workerId, today).orElse(null);
        
        if (attendance == null) {
            return Result.error("今日未签到");
        }

        if (attendance.getCheckOutTime() != null) {
            return Result.error("今日已签退");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        
        if (attendance.getCheckInTime() != null) {
            Duration duration = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime());
            long minutes = duration.toMinutes();
            BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            attendance.setWorkHours(hours);
        }

        LaborAttendance saved = laborAttendanceRepository.save(attendance);
        return Result.success("签退成功", saved);
    }

    public Result<LaborAttendance> addAttendance(LaborAttendance attendance) {
        LaborAttendance saved = laborAttendanceRepository.save(attendance);
        return Result.success("添加成功", saved);
    }

    public Result<LaborAttendance> updateAttendance(Long id, LaborAttendance attendance) {
        LaborAttendance existing = laborAttendanceRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("考勤记录不存在");
        }

        existing.setAttendanceDate(attendance.getAttendanceDate());
        existing.setCheckInTime(attendance.getCheckInTime());
        existing.setCheckOutTime(attendance.getCheckOutTime());
        existing.setWorkHours(attendance.getWorkHours());
        existing.setAttendanceType(attendance.getAttendanceType());
        existing.setLocation(attendance.getLocation());
        existing.setRemark(attendance.getRemark());

        LaborAttendance updated = laborAttendanceRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    public Result<Void> deleteAttendance(Long id) {
        if (!laborAttendanceRepository.existsById(id)) {
            return Result.error("考勤记录不存在");
        }
        laborAttendanceRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<LaborWorkHour> calculateWorkHours(Long workerId, LocalDate statisticsDate, String statisticsType) {
        LaborWorker worker = laborWorkerRepository.findById(workerId).orElse(null);
        if (worker == null) {
            return Result.error("工人不存在");
        }

        LocalDate startDate;
        LocalDate endDate;

        if ("MONTHLY".equals(statisticsType)) {
            startDate = statisticsDate.withDayOfMonth(1);
            endDate = statisticsDate.withDayOfMonth(statisticsDate.lengthOfMonth());
        } else if ("WEEKLY".equals(statisticsType)) {
            startDate = statisticsDate.minusDays(statisticsDate.getDayOfWeek().getValue() - 1);
            endDate = startDate.plusDays(6);
        } else {
            startDate = statisticsDate;
            endDate = statisticsDate;
        }

        Integer attendanceDays = laborAttendanceRepository.countAttendanceDays(workerId, startDate, endDate);
        BigDecimal totalHours = laborAttendanceRepository.sumWorkHours(workerId, startDate, endDate);

        BigDecimal normalWorkHoursPerDay = BigDecimal.valueOf(8);
        BigDecimal normalHours = BigDecimal.ZERO;
        BigDecimal overtimeHours = BigDecimal.ZERO;

        if (totalHours != null && attendanceDays != null) {
            BigDecimal normalTotal = normalWorkHoursPerDay.multiply(BigDecimal.valueOf(attendanceDays));
            if (totalHours.compareTo(normalTotal) > 0) {
                normalHours = normalTotal;
                overtimeHours = totalHours.subtract(normalTotal);
            } else {
                normalHours = totalHours;
            }
        }

        LaborWorkHour workHour = laborWorkHourRepository.findByWorkerIdAndStatisticsDateAndStatisticsType(
                workerId, statisticsDate, statisticsType).orElse(new LaborWorkHour());

        workHour.setWorkerId(workerId);
        workHour.setProjectId(worker.getProjectId());
        workHour.setStatisticsDate(statisticsDate);
        workHour.setStatisticsType(statisticsType);
        workHour.setAttendanceDays(attendanceDays);
        workHour.setTotalWorkHours(totalHours != null ? totalHours : BigDecimal.ZERO);
        workHour.setNormalHours(normalHours);
        workHour.setOvertimeHours(overtimeHours);

        LaborWorkHour saved = laborWorkHourRepository.save(workHour);
        return Result.success("统计完成", saved);
    }

    public Result<PageResult<LaborWorkHour>> getWorkHourList(Integer pageNum, Integer pageSize, Long projectId, Long workerId, LocalDate startDate, LocalDate endDate, String statisticsType) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "statisticsDate"));

        Specification<LaborWorkHour> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (workerId != null) {
                predicates.add(criteriaBuilder.equal(root.get("workerId"), workerId));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("statisticsDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("statisticsDate"), endDate));
            }

            if (statisticsType != null) {
                predicates.add(criteriaBuilder.equal(root.get("statisticsType"), statisticsType));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<LaborWorkHour> page = laborWorkHourRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }
}
