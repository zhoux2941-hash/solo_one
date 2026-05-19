package com.smartparking.service;

import com.smartparking.entity.ParkingLot;
import com.smartparking.repository.BillingOrderRepository;
import com.smartparking.repository.VehicleEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final BillingOrderRepository billingOrderRepository;
    private final VehicleEntryRepository vehicleEntryRepository;
    private final ParkingLotService parkingLotService;
    private final ParkingSpaceService parkingSpaceService;

    public long getTodayOrderCount() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        long total = 0;
        for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
            total += billingOrderRepository.countOrdersByParkingLotAndTime(lot.getId(), startOfDay, endOfDay);
        }
        return total;
    }

    public BigDecimal getTodayRevenue() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        BigDecimal total = BigDecimal.ZERO;
        for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
            BigDecimal revenue = billingOrderRepository.sumRevenueByParkingLotAndTime(lot.getId(), startOfDay, endOfDay);
            total = total.add(revenue);
        }
        return total;
    }

    public long getCurrentParkingCount() {
        long total = 0;
        for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
            total += vehicleEntryRepository.countParkingVehicles(lot.getId());
        }
        return total;
    }

    public List<Map<String, Object>> getParkingLotStatistics() {
        List<Map<String, Object>> stats = new ArrayList<>();
        for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
            Map<String, Object> lotStat = new HashMap<>();
            lotStat.put("id", lot.getId());
            lotStat.put("name", lot.getName());
            lotStat.put("totalSpaces", lot.getTotalSpaces());
            lotStat.put("availableSpaces", parkingSpaceService.getAvailableCount(lot.getId()));
            lotStat.put("parkingVehicles", vehicleEntryRepository.countParkingVehicles(lot.getId()));
            stats.add(lotStat);
        }
        return stats;
    }

    public List<Map<String, Object>> getHeatmapData() {
        List<Map<String, Object>> heatmapData = new ArrayList<>();
        for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", lot.getId());
            data.put("name", lot.getName());
            data.put("longitude", lot.getLongitude());
            data.put("latitude", lot.getLatitude());
            long parkingCount = vehicleEntryRepository.countParkingVehicles(lot.getId());
            data.put("parkingCount", parkingCount);
            data.put("totalSpaces", lot.getTotalSpaces());
            data.put("utilization", lot.getTotalSpaces() > 0 
                    ? (double) parkingCount / lot.getTotalSpaces() * 100 
                    : 0);
            heatmapData.add(data);
        }
        return heatmapData;
    }

    public Map<String, Object> getPeakStatistics(LocalDateTime start, LocalDateTime end) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> hourlyData = new ArrayList<>();
        
        LocalDateTime current = start;
        long maxCount = 0;
        String peakHour = "";
        
        while (current.isBefore(end)) {
            LocalDateTime hourEnd = current.plusHours(1);
            long count = 0;
            for (ParkingLot lot : parkingLotService.getAllParkingLots()) {
                count += billingOrderRepository.countOrdersByParkingLotAndTime(lot.getId(), current, hourEnd);
            }
            
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", current.getHour() + ":00");
            hourData.put("count", count);
            hourlyData.add(hourData);
            
            if (count > maxCount) {
                maxCount = count;
                peakHour = current.getHour() + ":00";
            }
            
            current = hourEnd;
        }
        
        result.put("hourlyData", hourlyData);
        result.put("peakHour", peakHour);
        result.put("peakCount", maxCount);
        
        return result;
    }
}
