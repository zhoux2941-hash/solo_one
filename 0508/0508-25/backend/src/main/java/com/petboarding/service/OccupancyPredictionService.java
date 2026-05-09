package com.petboarding.service;

import com.petboarding.entity.Room;
import com.petboarding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OccupancyPredictionService {
    
    private final OccupancyCacheService occupancyCacheService;
    private final RoomRepository roomRepository;
    
    public Map<String, Object> predictRoomOccupancy(Long roomId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        List<Map<String, Object>> dailyPredictions = new ArrayList<>();
        List<LocalDate> dates = new ArrayList<>();
        
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            double predictedRate = predictDailyOccupancy(roomId, date);
            
            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date", date);
            dayData.put("predictedRate", Math.round(predictedRate * 10000) / 100.0);
            dayData.put("actualRate", getActualOccupancy(roomId, date));
            
            dailyPredictions.add(dayData);
            dates.add(date);
            
            date = date.plusDays(1);
        }
        
        double avgPredictedRate = dailyPredictions.stream()
                .mapToDouble(d -> (Double) d.get("predictedRate"))
                .average()
                .orElse(0.0);
        
        result.put("roomId", roomId);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("averagePredictedRate", Math.round(avgPredictedRate * 100) / 100.0);
        result.put("dailyPredictions", dailyPredictions);
        result.put("trend", analyzeTrend(dailyPredictions));
        
        return result;
    }
    
    public Map<String, Object> predictRoomTypeOccupancy(String roomType, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        List<Room> rooms = roomRepository.findByRoomType(roomType);
        if (rooms.isEmpty()) {
            result.put("roomType", roomType);
            result.put("averagePredictedRate", 0.0);
            result.put("dailyPredictions", Collections.emptyList());
            return result;
        }
        
        Map<LocalDate, List<Double>> dailyRates = new LinkedHashMap<>();
        
        for (Room room : rooms) {
            Map<String, Object> roomPrediction = predictRoomOccupancy(room.getRoomId(), startDate, endDate);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> dailyPredictions = (List<Map<String, Object>>) roomPrediction.get("dailyPredictions");
            
            for (Map<String, Object> dayData : dailyPredictions) {
                LocalDate date = (LocalDate) dayData.get("date");
                Double rate = (Double) dayData.get("predictedRate");
                
                dailyRates.computeIfAbsent(date, k -> new ArrayList<>()).add(rate);
            }
        }
        
        List<Map<String, Object>> dailyPredictions = new ArrayList<>();
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            List<Double> rates = dailyRates.getOrDefault(date, Collections.emptyList());
            double avgRate = rates.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
            
            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date", date);
            dayData.put("predictedRate", Math.round(avgRate * 10000) / 100.0);
            dayData.put("roomCount", rates.size());
            
            dailyPredictions.add(dayData);
            date = date.plusDays(1);
        }
        
        double avgPredictedRate = dailyPredictions.stream()
                .mapToDouble(d -> (Double) d.get("predictedRate"))
                .average()
                .orElse(0.0);
        
        result.put("roomType", roomType);
        result.put("roomTypeName", getRoomTypeName(roomType));
        result.put("roomCount", rooms.size());
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("averagePredictedRate", Math.round(avgPredictedRate * 100) / 100.0);
        result.put("dailyPredictions", dailyPredictions);
        result.put("trend", analyzeTrend(dailyPredictions));
        
        return result;
    }
    
    private double predictDailyOccupancy(Long roomId, LocalDate targetDate) {
        double actualOccupancy = getActualOccupancy(roomId, targetDate);
        if (actualOccupancy > 0) {
            return actualOccupancy;
        }
        
        List<Double> historicalRates = getHistoricalRates(roomId, targetDate);
        
        if (historicalRates.isEmpty()) {
            return 50.0;
        }
        
        double historicalAvg = historicalRates.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(50.0);
        
        double dayOfWeekFactor = getDayOfWeekFactor(targetDate);
        
        double seasonFactor = getSeasonFactor(targetDate);
        
        double predictedRate = historicalAvg * dayOfWeekFactor * seasonFactor;
        
        return Math.min(100.0, Math.max(0.0, predictedRate));
    }
    
    private double getActualOccupancy(Long roomId, LocalDate date) {
        return occupancyCacheService.isOccupied(roomId, date) ? 100.0 : 0.0;
    }
    
    private List<Double> getHistoricalRates(Long roomId, LocalDate targetDate) {
        List<Double> rates = new ArrayList<>();
        
        LocalDate historicalDate = targetDate.minusDays(7);
        for (int i = 0; i < 4; i++) {
            if (historicalDate.isAfter(LocalDate.now().minusDays(1))) {
                break;
            }
            double rate = occupancyCacheService.isOccupied(roomId, historicalDate) ? 100.0 : 20.0;
            rates.add(rate);
            historicalDate = historicalDate.minusDays(7);
        }
        
        return rates;
    }
    
    private double getDayOfWeekFactor(LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        
        switch (dayOfWeek) {
            case 5:
            case 6:
                return 1.3;
            case 7:
                return 1.2;
            case 1:
            case 2:
                return 0.8;
            default:
                return 1.0;
        }
    }
    
    private double getSeasonFactor(LocalDate date) {
        int month = date.getMonthValue();
        
        switch (month) {
            case 1:
            case 2:
                return 0.9;
            case 7:
            case 8:
                return 1.4;
            case 10:
            case 12:
                return 1.3;
            default:
                return 1.0;
        }
    }
    
    private String analyzeTrend(List<Map<String, Object>> dailyPredictions) {
        if (dailyPredictions.size() < 2) {
            return "stable";
        }
        
        double firstHalfAvg = dailyPredictions.subList(0, dailyPredictions.size() / 2).stream()
                .mapToDouble(d -> (Double) d.get("predictedRate"))
                .average()
                .orElse(0.0);
        
        double secondHalfAvg = dailyPredictions.subList(dailyPredictions.size() / 2, dailyPredictions.size()).stream()
                .mapToDouble(d -> (Double) d.get("predictedRate"))
                .average()
                .orElse(0.0);
        
        double diff = secondHalfAvg - firstHalfAvg;
        
        if (diff > 10) {
            return "rising";
        } else if (diff < -10) {
            return "falling";
        } else {
            return "stable";
        }
    }
    
    private String getRoomTypeName(String roomType) {
        return switch (roomType) {
            case "SMALL_DOG_ROOM" -> "小型犬房";
            case "MEDIUM_DOG_ROOM" -> "中型犬房";
            case "LARGE_DOG_ROOM" -> "大型犬房";
            case "CAT_CAVE" -> "猫咪城堡";
            case "CAT_LOFT" -> "猫咪阁楼";
            case "DELUXE_CAT_ROOM" -> "豪华猫房";
            case "SMALL_PET_SUITE" -> "小型宠物套房";
            default -> roomType;
        };
    }
}
