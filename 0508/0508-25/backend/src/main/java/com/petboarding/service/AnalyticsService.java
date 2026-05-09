package com.petboarding.service;

import com.petboarding.entity.Booking;
import com.petboarding.entity.BookingLog;
import com.petboarding.entity.Pet;
import com.petboarding.entity.Room;
import com.petboarding.repository.BookingLogRepository;
import com.petboarding.repository.BookingRepository;
import com.petboarding.repository.PetRepository;
import com.petboarding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final BookingRepository bookingRepository;
    private final BookingLogRepository bookingLogRepository;
    private final PetRepository petRepository;
    private final RoomRepository roomRepository;
    private final OccupancyCacheService occupancyCacheService;
    
    public Map<String, Object> getOccupancyHeatmap(int year) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        List<String> months = Arrays.asList(
                "1月", "2月", "3月", "4月", "5月", "6月",
                "7月", "8月", "9月", "10月", "11月", "12月"
        );
        
        List<String> roomTypes = roomRepository.findAllRoomTypes();
        if (roomTypes.isEmpty()) {
            roomTypes = Arrays.asList("SMALL_DOG_ROOM", "MEDIUM_DOG_ROOM", "LARGE_DOG_ROOM", 
                    "CAT_CAVE", "CAT_LOFT", "DELUXE_CAT_ROOM", "SMALL_PET_SUITE");
        }
        
        List<Map<String, Object>> heatmapData = new ArrayList<>();
        
        for (int month = 1; month <= 12; month++) {
            for (String roomType : roomTypes) {
                List<Room> roomsOfType = roomRepository.findByRoomType(roomType);
                if (roomsOfType.isEmpty()) continue;
                
                double totalOccupancyRate = 0;
                int roomCount = 0;
                
                for (Room room : roomsOfType) {
                    double rate = occupancyCacheService.getOccupancyRate(room.getRoomId(), year, month);
                    totalOccupancyRate += rate;
                    roomCount++;
                }
                
                double avgRate = roomCount > 0 ? totalOccupancyRate / roomCount : 0;
                
                Map<String, Object> dataPoint = new LinkedHashMap<>();
                dataPoint.put("month", months.get(month - 1));
                dataPoint.put("monthNum", month);
                dataPoint.put("roomType", roomType);
                dataPoint.put("roomTypeName", getRoomTypeName(roomType));
                dataPoint.put("occupancyRate", Math.round(avgRate * 10000) / 100.0);
                
                heatmapData.add(dataPoint);
            }
        }
        
        result.put("months", months);
        result.put("roomTypes", roomTypes.stream()
                .map(this::getRoomTypeName)
                .collect(Collectors.toList()));
        result.put("roomTypeCodes", roomTypes);
        result.put("heatmapData", heatmapData);
        result.put("year", year);
        
        return result;
    }
    
    public Map<String, Object> getPetTypePreference() {
        Map<String, Object> result = new LinkedHashMap<>();
        
        List<Booking> confirmedBookings = bookingRepository.findByStatus(Booking.BookingStatus.CONFIRMED);
        
        Map<String, Map<String, Long>> typeByRoom = new LinkedHashMap<>();
        Map<String, Long> totalByRoom = new LinkedHashMap<>();
        
        List<String> roomTypes = roomRepository.findAllRoomTypes();
        for (String roomType : roomTypes) {
            typeByRoom.put(roomType, new LinkedHashMap<>());
            typeByRoom.get(roomType).put("DOG", 0L);
            typeByRoom.get(roomType).put("CAT", 0L);
            totalByRoom.put(roomType, 0L);
        }
        
        Map<Long, Pet> petMap = petRepository.findAll().stream()
                .collect(Collectors.toMap(Pet::getPetId, p -> p));
        
        Map<Long, Room> roomMap = roomRepository.findAll().stream()
                .collect(Collectors.toMap(Room::getRoomId, r -> r));
        
        for (Booking booking : confirmedBookings) {
            Pet pet = petMap.get(booking.getPetId());
            Room room = roomMap.get(booking.getRoomId());
            
            if (pet != null && room != null && roomTypes.contains(room.getRoomType())) {
                String roomType = room.getRoomType();
                String petType = pet.getType().name();
                
                typeByRoom.get(roomType).merge(petType, 1L, Long::sum);
                totalByRoom.merge(roomType, 1L, Long::sum);
            }
        }
        
        List<Map<String, Object>> chartData = new ArrayList<>();
        for (String roomType : roomTypes) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("roomType", roomType);
            data.put("roomTypeName", getRoomTypeName(roomType));
            
            long total = totalByRoom.get(roomType);
            long dogCount = typeByRoom.get(roomType).get("DOG");
            long catCount = typeByRoom.get(roomType).get("CAT");
            
            data.put("dogCount", dogCount);
            data.put("catCount", catCount);
            data.put("total", total);
            data.put("dogPercentage", total > 0 ? Math.round((double) dogCount / total * 10000) / 100.0 : 0);
            data.put("catPercentage", total > 0 ? Math.round((double) catCount / total * 10000) / 100.0 : 0);
            
            chartData.add(data);
        }
        
        result.put("roomTypes", roomTypes.stream()
                .map(this::getRoomTypeName)
                .collect(Collectors.toList()));
        result.put("roomTypeCodes", roomTypes);
        result.put("data", chartData);
        
        return result;
    }
    
    public Map<String, Object> getConflictAnalysis(int year, int month) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = YearMonth.of(year, month).atEndOfMonth();
        
        List<BookingLog> rejectedLogs = bookingLogRepository.findRejectedLogsInDateRange(startDate, endDate);
        
        Map<String, Long> conflictsByDate = new TreeMap<>();
        Map<String, Long> conflictsByRoomType = new LinkedHashMap<>();
        Map<String, Long> conflictsByDayOfWeek = new LinkedHashMap<>();
        
        String[] dayNames = {"周日", "周一", "周二", "周三", "周四", "周五", "周六"};
        
        for (BookingLog log : rejectedLogs) {
            LocalDate date = log.getStartDate();
            if (date == null) continue;
            
            String dateStr = date.toString();
            conflictsByDate.merge(dateStr, 1L, Long::sum);
            
            Room room = roomRepository.findById(log.getRoomId()).orElse(null);
            if (room != null) {
                String roomTypeName = getRoomTypeName(room.getRoomType());
                conflictsByRoomType.merge(roomTypeName, 1L, Long::sum);
            }
            
            int dayOfWeek = date.getDayOfWeek().getValue() % 7;
            conflictsByDayOfWeek.merge(dayNames[dayOfWeek], 1L, Long::sum);
        }
        
        List<Map<String, Object>> dateChartData = new ArrayList<>();
        for (Map.Entry<String, Long> entry : conflictsByDate.entrySet()) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("date", entry.getKey());
            data.put("conflicts", entry.getValue());
            dateChartData.add(data);
        }
        
        List<Map<String, Object>> roomTypeChartData = new ArrayList<>();
        for (Map.Entry<String, Long> entry : conflictsByRoomType.entrySet()) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("roomType", entry.getKey());
            data.put("conflicts", entry.getValue());
            roomTypeChartData.add(data);
        }
        
        List<Map<String, Object>> dayOfWeekChartData = new ArrayList<>();
        for (String day : dayNames) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("day", day);
            data.put("conflicts", conflictsByDayOfWeek.getOrDefault(day, 0L));
            dayOfWeekChartData.add(data);
        }
        
        result.put("year", year);
        result.put("month", month);
        result.put("totalConflicts", rejectedLogs.size());
        result.put("byDate", dateChartData);
        result.put("byRoomType", roomTypeChartData);
        result.put("byDayOfWeek", dayOfWeekChartData);
        
        if (!dateChartData.isEmpty()) {
            Map<String, Object> peakDate = dateChartData.stream()
                    .max((a, b) -> Long.compare((Long) a.get("conflicts"), (Long) b.get("conflicts")))
                    .orElse(null);
            result.put("peakDate", peakDate);
        }
        
        if (!dayOfWeekChartData.isEmpty()) {
            Map<String, Object> peakDay = dayOfWeekChartData.stream()
                    .max((a, b) -> Long.compare((Long) a.get("conflicts"), (Long) b.get("conflicts")))
                    .orElse(null);
            result.put("peakDay", peakDay);
        }
        
        return result;
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
