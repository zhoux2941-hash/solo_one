package com.industrial.workorder.service;

import com.industrial.workorder.dto.DailyStatisticsDTO;
import com.industrial.workorder.dto.WorkOrderStatisticsDTO;
import com.industrial.workorder.repository.DeviceRepository;
import com.industrial.workorder.repository.UserRepository;
import com.industrial.workorder.repository.WorkOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Cacheable(value = "dailyStatistics", key = "#date.toString()", unless = "#result == null")
    public DailyStatisticsDTO getDailyStatistics(LocalDate date) {
        DailyStatisticsDTO dto = new DailyStatisticsDTO();
        dto.setDate(date);

        Long totalCount = workOrderRepository.countByCreateDate(date);
        Long completedCount = workOrderRepository.countCompletedByCreateDate(date);
        
        dto.setTotalCount(totalCount);
        dto.setCompletedCount(completedCount);
        dto.calculateCompletionRate();

        List<Object[]> statusCounts = workOrderRepository.countByStatusAndDate(date);
        for (Object[] row : statusCounts) {
            String status = (String) row[0];
            Long count = (Long) row[1];
            
            switch (status) {
                case "PENDING":
                case "LEADER_APPROVED":
                case "ADMIN_APPROVED":
                    dto.setPendingCount(dto.getPendingCount() + count);
                    break;
                case "ASSIGNED":
                case "IN_PROGRESS":
                    dto.setInProgressCount(dto.getInProgressCount() + count);
                    break;
                case "REJECTED":
                    dto.setRejectedCount(dto.getRejectedCount() + count);
                    break;
            }
        }

        dto.setByAssignee(getByAssigneeStatistics(date));
        dto.setByFaultType(getByFaultTypeStatistics(date));
        dto.setByPriority(getByPriorityStatistics(date));
        dto.setByDevice(getByDeviceStatistics(date));

        return dto;
    }

    @Cacheable(value = "dateRangeStatistics", key = "#startDate.toString() + '_' + #endDate.toString()")
    public List<DailyStatisticsDTO> getDateRangeStatistics(LocalDate startDate, LocalDate endDate) {
        List<DailyStatisticsDTO> result = new ArrayList<>();
        
        LocalDateTime startTime = startDate.atStartOfDay();
        LocalDateTime endTime = endDate.atTime(LocalTime.MAX);

        List<Object[]> statusByDate = workOrderRepository.countByDateRangeAndStatus(startTime, endTime);
        
        Map<LocalDate, DailyStatisticsDTO> dateMap = new LinkedHashMap<>();
        
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DailyStatisticsDTO dto = new DailyStatisticsDTO();
            dto.setDate(current);
            dateMap.put(current, dto);
            current = current.plusDays(1);
        }

        for (Object[] row : statusByDate) {
            java.sql.Date sqlDate = (java.sql.Date) row[0];
            LocalDate date = sqlDate.toLocalDate();
            String status = (String) row[1];
            Long count = (Long) row[2];

            DailyStatisticsDTO dto = dateMap.get(date);
            if (dto != null) {
                dto.setTotalCount(dto.getTotalCount() + count);
                
                if ("COMPLETED".equals(status)) {
                    dto.setCompletedCount(dto.getCompletedCount() + count);
                } else if ("PENDING".equals(status) || "LEADER_APPROVED".equals(status) || "ADMIN_APPROVED".equals(status)) {
                    dto.setPendingCount(dto.getPendingCount() + count);
                } else if ("ASSIGNED".equals(status) || "IN_PROGRESS".equals(status)) {
                    dto.setInProgressCount(dto.getInProgressCount() + count);
                } else if ("REJECTED".equals(status)) {
                    dto.setRejectedCount(dto.getRejectedCount() + count);
                }
            }
        }

        for (DailyStatisticsDTO dto : dateMap.values()) {
            dto.calculateCompletionRate();
        }

        result.addAll(dateMap.values());
        return result;
    }

    public WorkOrderStatisticsDTO getAssigneeStatistics(Long assigneeId, LocalDate startDate, LocalDate endDate) {
        WorkOrderStatisticsDTO dto = new WorkOrderStatisticsDTO();
        dto.setAssigneeId(assigneeId);

        Long total = workOrderRepository.countByAssigneeAndDateRange(assigneeId, startDate, endDate);
        Long completed = workOrderRepository.countCompletedByAssigneeAndDateRange(assigneeId, startDate, endDate);

        dto.setTotalCount(total);
        dto.setCompletedCount(completed);
        dto.calculateCompletionRate();

        userRepository.findById(assigneeId).ifPresent(u -> dto.setAssigneeName(u.getRealName()));

        return dto;
    }

    public List<WorkOrderStatisticsDTO> getAllAssigneesStatistics(LocalDate startDate, LocalDate endDate) {
        List<WorkOrderStatisticsDTO> result = new ArrayList<>();
        
        userRepository.findByRole("WORKER").forEach(worker -> {
            WorkOrderStatisticsDTO dto = getAssigneeStatistics(worker.getId(), startDate, endDate);
            result.add(dto);
        });

        result.sort((a, b) -> b.getCompletionRate().compareTo(a.getCompletionRate()));
        return result;
    }

    public Map<String, Object> getDashboardOverview(LocalDate date) {
        Map<String, Object> result = new HashMap<>();
        
        DailyStatisticsDTO todayStats = getDailyStatistics(date);
        
        LocalDate yesterday = date.minusDays(1);
        DailyStatisticsDTO yesterdayStats = getDailyStatistics(yesterday);
        
        LocalDate weekStart = date.minusDays(date.getDayOfWeek().getValue() - 1);
        LocalDate weekEnd = weekStart.plusDays(6);
        Long weekTotal = workOrderRepository.countByDateRange(weekStart, weekEnd);
        Long weekCompleted = workOrderRepository.countCompletedByDateRange(weekStart, weekEnd);

        LocalDate monthStart = date.withDayOfMonth(1);
        LocalDate monthEnd = date.withDayOfMonth(date.lengthOfMonth());
        Long monthTotal = workOrderRepository.countByDateRange(monthStart, monthEnd);
        Long monthCompleted = workOrderRepository.countCompletedByDateRange(monthStart, monthEnd);

        result.put("today", todayStats);
        result.put("yesterday", yesterdayStats);
        result.put("week", buildRateMap(weekTotal, weekCompleted));
        result.put("month", buildRateMap(monthTotal, monthCompleted));
        
        return result;
    }

    private List<Map<String, Object>> getByAssigneeStatistics(LocalDate date) {
        List<Object[]> totalByAssignee = workOrderRepository.countByAssigneeAndDate(date);
        List<Object[]> completedByAssignee = workOrderRepository.countCompletedByAssigneeAndDate(date);

        Map<Long, Long> completedMap = completedByAssignee.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        return totalByAssignee.stream()
                .filter(row -> row[0] != null)
                .map(row -> {
                    Long assigneeId = (Long) row[0];
                    Long total = (Long) row[1];
                    Long completed = completedMap.getOrDefault(assigneeId, 0L);
                    double rate = total > 0 ? (double) completed / total * 100 : 0.0;

                    Map<String, Object> map = new HashMap<>();
                    map.put("assigneeId", assigneeId);
                    map.put("assigneeName", getUserName(assigneeId));
                    map.put("totalCount", total);
                    map.put("completedCount", completed);
                    map.put("completionRate", Math.round(rate * 100.0) / 100.0);
                    return map;
                })
                .sorted((a, b) -> Double.compare((Double) b.get("completionRate"), (Double) a.get("completionRate")))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getByFaultTypeStatistics(LocalDate date) {
        List<Object[]> totalByType = workOrderRepository.countByFaultTypeAndDate(date);
        List<Object[]> completedByType = workOrderRepository.countCompletedByFaultTypeAndDate(date);

        Map<String, Long> completedMap = completedByType.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        return totalByType.stream()
                .filter(row -> row[0] != null)
                .map(row -> {
                    String faultType = (String) row[0];
                    Long total = (Long) row[1];
                    Long completed = completedMap.getOrDefault(faultType, 0L);
                    double rate = total > 0 ? (double) completed / total * 100 : 0.0;

                    Map<String, Object> map = new HashMap<>();
                    map.put("faultType", faultType);
                    map.put("totalCount", total);
                    map.put("completedCount", completed);
                    map.put("completionRate", Math.round(rate * 100.0) / 100.0);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getByPriorityStatistics(LocalDate date) {
        List<Object[]> totalByPriority = workOrderRepository.countByPriorityAndDate(date);
        List<Object[]> completedByPriority = workOrderRepository.countCompletedByPriorityAndDate(date);

        Map<String, Long> completedMap = completedByPriority.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        return totalByPriority.stream()
                .filter(row -> row[0] != null)
                .map(row -> {
                    String priority = (String) row[0];
                    Long total = (Long) row[1];
                    Long completed = completedMap.getOrDefault(priority, 0L);
                    double rate = total > 0 ? (double) completed / total * 100 : 0.0;

                    Map<String, Object> map = new HashMap<>();
                    map.put("priority", priority);
                    map.put("totalCount", total);
                    map.put("completedCount", completed);
                    map.put("completionRate", Math.round(rate * 100.0) / 100.0);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getByDeviceStatistics(LocalDate date) {
        List<Object[]> totalByDevice = workOrderRepository.countByDeviceAndDate(date);
        List<Object[]> completedByDevice = workOrderRepository.countCompletedByDeviceAndDate(date);

        Map<Long, Long> completedMap = completedByDevice.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        return totalByDevice.stream()
                .filter(row -> row[0] != null)
                .map(row -> {
                    Long deviceId = (Long) row[0];
                    Long total = (Long) row[1];
                    Long completed = completedMap.getOrDefault(deviceId, 0L);
                    double rate = total > 0 ? (double) completed / total * 100 : 0.0;

                    Map<String, Object> map = new HashMap<>();
                    map.put("deviceId", deviceId);
                    map.put("deviceName", getDeviceName(deviceId));
                    map.put("totalCount", total);
                    map.put("completedCount", completed);
                    map.put("completionRate", Math.round(rate * 100.0) / 100.0);
                    return map;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("totalCount"), (Long) a.get("totalCount")))
                .limit(10)
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildRateMap(Long total, Long completed) {
        Map<String, Object> map = new HashMap<>();
        map.put("totalCount", total);
        map.put("completedCount", completed);
        double rate = total > 0 ? (double) completed / total * 100 : 0.0;
        map.put("completionRate", Math.round(rate * 100.0) / 100.0);
        return map;
    }

    private String getUserName(Long userId) {
        return userRepository.findById(userId)
                .map(u -> u.getRealName())
                .orElse("未知用户");
    }

    private String getDeviceName(Long deviceId) {
        return deviceRepository.findById(deviceId)
                .map(d -> d.getDeviceName())
                .orElse("未知设备");
    }
}
