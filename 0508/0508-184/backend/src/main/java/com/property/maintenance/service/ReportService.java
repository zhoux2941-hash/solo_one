package com.property.maintenance.service;

import com.property.maintenance.entity.RepairOrder;
import com.property.maintenance.entity.Repairman;
import com.property.maintenance.repository.RepairOrderRepository;
import com.property.maintenance.repository.RepairmanRepository;
import com.property.maintenance.repository.SparePartUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class ReportService {

    @Autowired
    private RepairmanRepository repairmanRepository;

    @Autowired
    private RepairOrderRepository repairOrderRepository;

    @Autowired
    private SparePartUsageRepository sparePartUsageRepository;

    public List<Map<String, Object>> getAverageRepairDuration() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Repairman> repairmen = repairmanRepository.findByStatus(1);

        for (Repairman repairman : repairmen) {
            List<RepairOrder> completedOrders = repairOrderRepository.findCompletedOrdersByRepairmanId(repairman.getId());

            Map<String, Object> item = new HashMap<>();
            item.put("repairmanId", repairman.getId());
            item.put("repairmanName", repairman.getName());
            item.put("totalOrders", completedOrders.size());

            if (completedOrders.isEmpty()) {
                item.put("averageDuration", 0);
                item.put("averageDurationFormatted", "0分钟");
            } else {
                long totalMinutes = 0;
                for (RepairOrder order : completedOrders) {
                    if (order.getStartTime() != null && order.getCompleteTime() != null) {
                        Duration duration = Duration.between(order.getStartTime(), order.getCompleteTime());
                        totalMinutes += duration.toMinutes();
                    }
                }
                long avgMinutes = totalMinutes / completedOrders.size();
                item.put("averageDuration", avgMinutes);
                item.put("averageDurationFormatted", formatDuration(avgMinutes));
            }
            result.add(item);
        }

        result.sort((a, b) -> Long.compare((Long) a.get("averageDuration"), (Long) b.get("averageDuration")));

        return result;
    }

    public List<Map<String, Object>> getSparePartConsumptionRanking() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Object[]> usageData = sparePartUsageRepository.findTotalQuantityByRepairman();
        Map<Long, Repairman> repairmanMap = new HashMap<>();

        for (Repairman repairman : repairmanRepository.findAll()) {
            repairmanMap.put(repairman.getId(), repairman);
        }

        int rank = 1;
        for (Object[] row : usageData) {
            Long repairmanId = (Long) row[0];
            Long totalQuantity = ((Number) row[1]).longValue();

            Repairman repairman = repairmanMap.get(repairmanId);
            if (repairman != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("rank", rank++);
                item.put("repairmanId", repairmanId);
                item.put("repairmanName", repairman.getName());
                item.put("totalQuantity", totalQuantity);
                result.add(item);
            }
        }

        return result;
    }

    private String formatDuration(long minutes) {
        if (minutes < 60) {
            return minutes + "分钟";
        } else {
            long hours = minutes / 60;
            long mins = minutes % 60;
            if (mins == 0) {
                return hours + "小时";
            } else {
                return hours + "小时" + mins + "分钟";
            }
        }
    }
}
