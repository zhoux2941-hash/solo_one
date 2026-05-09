package com.company.seatbooking.service;

import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.entity.Booking.BookingStatus;
import com.company.seatbooking.repository.BookingRepository;
import com.company.seatbooking.repository.SeatRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    
    public AnalyticsService(BookingRepository bookingRepository, SeatRepository seatRepository) {
        this.bookingRepository = bookingRepository;
        this.seatRepository = seatRepository;
    }
    
    public Map<String, Object> getAreaUsageRate(LocalDate startDate, LocalDate endDate) {
        List<String> areas = seatRepository.findAllAreas();
        List<LocalDate> dates = startDate.datesUntil(endDate.plusDays(1)).collect(Collectors.toList());
        
        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        
        List<Object[]> statistics = bookingRepository.findBookingStatistics(
            BookingStatus.CONFIRMED, startDate, endDate);
        
        for (String area : areas) {
            List<Map<String, Object>> dailyData = new ArrayList<>();
            Long totalSeats = seatRepository.countByArea(area);
            
            for (LocalDate date : dates) {
                long morningBookings = 0;
                long afternoonBookings = 0;
                
                for (Object[] stat : statistics) {
                    String statArea = (String) stat[0];
                    LocalDate statDate = (LocalDate) stat[1];
                    String timeSlot = stat[2].toString();
                    Long count = (Long) stat[3];
                    
                    if (statArea.equals(area) && statDate.equals(date)) {
                        if (timeSlot.equals("MORNING") || timeSlot.equals("FULL_DAY")) {
                            morningBookings += count;
                        }
                        if (timeSlot.equals("AFTERNOON") || timeSlot.equals("FULL_DAY")) {
                            afternoonBookings += count;
                        }
                    }
                }
                
                double morningRate = totalSeats > 0 ? (double) morningBookings / totalSeats * 100 : 0;
                double afternoonRate = totalSeats > 0 ? (double) afternoonBookings / totalSeats * 100 : 0;
                double avgRate = (morningRate + afternoonRate) / 2;
                
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                dayData.put("morningRate", Math.round(morningRate * 100.0) / 100.0);
                dayData.put("afternoonRate", Math.round(afternoonRate * 100.0) / 100.0);
                dayData.put("avgRate", Math.round(avgRate * 100.0) / 100.0);
                dailyData.add(dayData);
            }
            
            result.put(area, dailyData);
        }
        
        return result;
    }
    
    public List<Map<String, Object>> getTopSeats(int limit) {
        List<Object[]> topSeats = bookingRepository.findTopSeatsByBookingCount(BookingStatus.CONFIRMED);
        
        return topSeats.stream()
            .limit(limit)
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("seatId", row[0]);
                map.put("bookingCount", row[1]);
                return map;
            })
            .collect(Collectors.toList());
    }
    
    public Map<String, Object> predictAvailableSlots() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(30);
        LocalDate endDate = today.minusDays(1);
        
        List<Object[]> timeSlotStats = bookingRepository.findTimeSlotStatistics(
            BookingStatus.CONFIRMED, startDate, endDate);
        
        Map<DayOfWeek, Map<String, Integer>> dayTimeSlotBookings = new HashMap<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            Map<String, Integer> slots = new HashMap<>();
            slots.put("MORNING", 0);
            slots.put("AFTERNOON", 0);
            dayTimeSlotBookings.put(day, slots);
        }
        
        Map<DayOfWeek, Integer> dayCounts = new HashMap<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            dayCounts.put(day, 0);
        }
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            dayCounts.put(day, dayCounts.get(day) + 1);
        }
        
        for (Object[] stat : timeSlotStats) {
            String timeSlot = stat[0].toString();
            LocalDate date = (LocalDate) stat[1];
            Long count = (Long) stat[2];
            
            DayOfWeek day = date.getDayOfWeek();
            Map<String, Integer> slots = dayTimeSlotBookings.get(day);
            
            if (timeSlot.equals("MORNING")) {
                slots.put("MORNING", slots.get("MORNING") + count.intValue());
            } else if (timeSlot.equals("AFTERNOON")) {
                slots.put("AFTERNOON", slots.get("AFTERNOON") + count.intValue());
            } else if (timeSlot.equals("FULL_DAY")) {
                slots.put("MORNING", slots.get("MORNING") + count.intValue());
                slots.put("AFTERNOON", slots.get("AFTERNOON") + count.intValue());
            }
        }
        
        List<Map<String, Object>> predictions = new ArrayList<>();
        
        for (int i = 1; i <= 7; i++) {
            LocalDate futureDate = today.plusDays(i);
            DayOfWeek day = futureDate.getDayOfWeek();
            
            int totalDays = dayCounts.get(day);
            if (totalDays == 0) totalDays = 1;
            
            Map<String, Integer> slots = dayTimeSlotBookings.get(day);
            int morningBookings = slots.get("MORNING");
            int afternoonBookings = slots.get("AFTERNOON");
            
            double avgMorningBookings = (double) morningBookings / totalDays;
            double avgAfternoonBookings = (double) afternoonBookings / totalDays;
            
            double morningAvailableRate = 100 - Math.min(avgMorningBookings * 10, 100);
            double afternoonAvailableRate = 100 - Math.min(avgAfternoonBookings * 10, 100);
            
            Map<String, Object> pred = new HashMap<>();
            pred.put("date", futureDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
            pred.put("dayOfWeek", day.toString());
            pred.put("morningAvailableRate", Math.round(morningAvailableRate * 100.0) / 100.0);
            pred.put("afternoonAvailableRate", Math.round(afternoonAvailableRate * 100.0) / 100.0);
            
            if (morningAvailableRate > afternoonAvailableRate) {
                pred.put("bestSlot", "MORNING");
                pred.put("bestRate", morningAvailableRate);
            } else {
                pred.put("bestSlot", "AFTERNOON");
                pred.put("bestRate", afternoonAvailableRate);
            }
            
            predictions.add(pred);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("predictions", predictions);
        
        Map<String, Object> bestOverall = predictions.stream()
            .max(Comparator.comparingDouble(p -> (Double) p.get("bestRate")))
            .orElse(null);
        result.put("bestOverall", bestOverall);
        
        return result;
    }
}
