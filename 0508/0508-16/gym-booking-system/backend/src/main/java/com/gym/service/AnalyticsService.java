package com.gym.service;

import com.gym.entity.Booking;
import com.gym.entity.Course;
import com.gym.repository.BookingRepository;
import com.gym.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    public Map<String, Object> getCoachCheckinRateOverTime(Long coachId, int days) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(days);
        
        List<Course> courses = courseRepository.findCoursesBetweenDates(start, end);
        List<Course> coachCourses = courses.stream()
                .filter(c -> c.getCoachId().equals(coachId))
                .collect(Collectors.toList());
        
        Map<String, Double> dailyRates = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");
        
        for (int i = 0; i < days; i++) {
            LocalDateTime dayStart = start.plusDays(i);
            LocalDateTime dayEnd = dayStart.plusDays(1);
            String dateKey = dayStart.format(formatter);
            
            List<Course> dayCourses = coachCourses.stream()
                    .filter(c -> c.getStartTime().isAfter(dayStart) && c.getStartTime().isBefore(dayEnd))
                    .collect(Collectors.toList());
            
            int totalBookings = 0;
            int totalCheckins = 0;
            
            for (Course course : dayCourses) {
                long bookings = bookingRepository.countBookingsByCourseId(course.getCourseId());
                long checkins = bookingRepository.countByCourseIdAndStatus(course.getCourseId(), Booking.BookingStatus.CHECKED_IN);
                totalBookings += bookings;
                totalCheckins += checkins;
            }
            
            double rate = totalBookings > 0 ? (double) totalCheckins / totalBookings * 100 : 0;
            dailyRates.put(dateKey, Math.round(rate * 100.0) / 100.0);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("dates", new ArrayList<>(dailyRates.keySet()));
        result.put("rates", new ArrayList<>(dailyRates.values()));
        
        return result;
    }
    
    public List<Map<String, Object>> getCheckinHeatmap(int weeks) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusWeeks(weeks);
        
        List<Course> courses = courseRepository.findCoursesBetweenDates(start, end);
        
        Map<String, Map<String, Integer>> heatmapData = new LinkedHashMap<>();
        
        String[] timeSlots = {"06:00-08:00", "08:00-10:00", "10:00-12:00", 
                              "12:00-14:00", "14:00-16:00", "16:00-18:00", 
                              "18:00-20:00", "20:00-22:00"};
        
        String[] days = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};
        
        for (String timeSlot : timeSlots) {
            Map<String, Integer> dayCounts = new LinkedHashMap<>();
            for (String day : days) {
                dayCounts.put(day, 0);
            }
            heatmapData.put(timeSlot, dayCounts);
        }
        
        for (Course course : courses) {
            DayOfWeek dayOfWeek = course.getStartTime().getDayOfWeek();
            int dayIndex = dayOfWeek.getValue() - 1;
            String dayName = days[dayIndex];
            
            LocalTime startTime = course.getStartTime().toLocalTime();
            String timeSlot = getTimeSlot(startTime);
            
            if (timeSlot != null && heatmapData.containsKey(timeSlot)) {
                long checkins = bookingRepository.countByCourseIdAndStatus(course.getCourseId(), Booking.BookingStatus.CHECKED_IN);
                int current = heatmapData.get(timeSlot).get(dayName);
                heatmapData.get(timeSlot).put(dayName, current + (int) checkins);
            }
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (String timeSlot : timeSlots) {
            for (String day : days) {
                Map<String, Object> item = new HashMap<>();
                item.put("day", day);
                item.put("timeSlot", timeSlot);
                item.put("value", heatmapData.get(timeSlot).get(day));
                result.add(item);
            }
        }
        
        return result;
    }
    
    private String getTimeSlot(LocalTime time) {
        int hour = time.getHour();
        if (hour >= 6 && hour < 8) return "06:00-08:00";
        if (hour >= 8 && hour < 10) return "08:00-10:00";
        if (hour >= 10 && hour < 12) return "10:00-12:00";
        if (hour >= 12 && hour < 14) return "12:00-14:00";
        if (hour >= 14 && hour < 16) return "14:00-16:00";
        if (hour >= 16 && hour < 18) return "16:00-18:00";
        if (hour >= 18 && hour < 20) return "18:00-20:00";
        if (hour >= 20 && hour < 22) return "20:00-22:00";
        return null;
    }
    
    public List<Map<String, Object>> getTopNoShowCourses(int limit) {
        List<Object[]> results = bookingRepository.getTopNoShowCourses();
        
        return results.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("courseName", row[0]);
                    long totalBookings = ((Number) row[1]).longValue();
                    long noShows = ((Number) row[2]).longValue();
                    double rate = totalBookings > 0 ? (double) noShows / totalBookings * 100 : 0;
                    item.put("totalBookings", totalBookings);
                    item.put("noShows", noShows);
                    item.put("noShowRate", Math.round(rate * 100.0) / 100.0);
                    return item;
                })
                .collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getAllCoaches() {
        List<Course> courses = courseRepository.findAll();
        Map<Long, String> coachMap = new LinkedHashMap<>();
        
        for (Course course : courses) {
            coachMap.put(course.getCoachId(), course.getCoachName());
        }
        
        return coachMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> coach = new HashMap<>();
                    coach.put("coachId", entry.getKey());
                    coach.put("coachName", entry.getValue());
                    return coach;
                })
                .collect(Collectors.toList());
    }
}
