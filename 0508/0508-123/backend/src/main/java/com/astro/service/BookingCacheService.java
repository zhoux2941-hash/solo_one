package com.astro.service;

import com.astro.config.AppConfig;
import com.astro.dto.SlotInfo;
import com.astro.entity.Booking;
import com.astro.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BookingCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final BookingRepository bookingRepository;
    private final AppConfig appConfig;

    private static final String BOOKING_KEY_PREFIX = "booking:telescope:";
    private static final String SLOT_KEY_PREFIX = "slot:telescope:";

    @PostConstruct
    public void initCache() {
        refreshAllCache();
    }

    public void refreshAllCache() {
        List<Long> allTelescopeIds = Arrays.asList(1L, 2L, 3L);
        for (Long telescopeId : allTelescopeIds) {
            refreshTelescopeCache(telescopeId);
        }
    }

    public void refreshTelescopeCache(Long telescopeId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = now.plusDays(appConfig.getCache().getDaysAhead());

        List<Booking> bookings = bookingRepository.findByTelescopeAndTimeRange(
                telescopeId, now, endTime);

        String key = BOOKING_KEY_PREFIX + telescopeId;
        redisTemplate.delete(key);

        for (Booking booking : bookings) {
            if (Arrays.asList("PENDING", "CONFIRMED", "IN_PROGRESS").contains(booking.getStatus())) {
                cacheBookingSlot(telescopeId, booking);
            }
        }

        redisTemplate.expire(key, appConfig.getCache().getDaysAhead() + 1, TimeUnit.DAYS);
    }

    public void cacheBookingSlot(Long telescopeId, Booking booking) {
        List<LocalDateTime> slotStarts = getSlotStartsInRange(
                booking.getStartTime(), booking.getEndTime());

        for (LocalDateTime slotStart : slotStarts) {
            String slotKey = SLOT_KEY_PREFIX + telescopeId + ":" + 
                            slotStart.toLocalDate().toString() + ":" + 
                            slotStart.toLocalTime().toString();
            
            Map<String, Object> slotData = new HashMap<>();
            slotData.put("bookingId", booking.getId());
            slotData.put("userId", booking.getUserId());
            slotData.put("userName", booking.getUserName());
            slotData.put("startTime", booking.getStartTime().toString());
            slotData.put("endTime", booking.getEndTime().toString());
            slotData.put("status", booking.getStatus());

            redisTemplate.opsForValue().set(slotKey, slotData, 
                    appConfig.getCache().getDaysAhead() + 1, TimeUnit.DAYS);
        }
    }

    public boolean isSlotAvailable(Long telescopeId, LocalDateTime slotStart) {
        String slotKey = SLOT_KEY_PREFIX + telescopeId + ":" + 
                        slotStart.toLocalDate().toString() + ":" + 
                        slotStart.toLocalTime().toString();
        
        return Boolean.FALSE.equals(redisTemplate.hasKey(slotKey));
    }

    public void markSlotOccupied(Long telescopeId, LocalDateTime slotStart, Booking booking) {
        String slotKey = SLOT_KEY_PREFIX + telescopeId + ":" + 
                        slotStart.toLocalDate().toString() + ":" + 
                        slotStart.toLocalTime().toString();

        Map<String, Object> slotData = new HashMap<>();
        slotData.put("bookingId", booking.getId());
        slotData.put("userId", booking.getUserId());
        slotData.put("userName", booking.getUserName());
        slotData.put("startTime", booking.getStartTime().toString());
        slotData.put("endTime", booking.getEndTime().toString());
        slotData.put("status", booking.getStatus());

        redisTemplate.opsForValue().set(slotKey, slotData, 
                appConfig.getCache().getDaysAhead() + 1, TimeUnit.DAYS);
    }

    public void markSlotAvailable(Long telescopeId, LocalDateTime slotStart) {
        String slotKey = SLOT_KEY_PREFIX + telescopeId + ":" + 
                        slotStart.toLocalDate().toString() + ":" + 
                        slotStart.toLocalTime().toString();
        
        redisTemplate.delete(slotKey);
    }

    public List<SlotInfo> getTelescopeSlotsForDate(Long telescopeId, LocalDate date) {
        List<SlotInfo> slots = new ArrayList<>();
        
        int startHour = appConfig.getBooking().getStartHour();
        int endHour = appConfig.getBooking().getEndHour();
        int slotMinutes = appConfig.getBooking().getSlotMinutes();

        LocalTime time = LocalTime.of(startHour, 0);
        LocalTime endTime = LocalTime.of(endHour, 0);

        while (time.isBefore(endTime)) {
            LocalDateTime slotStart = LocalDateTime.of(date, time);
            LocalDateTime slotEnd = slotStart.plusMinutes(slotMinutes);

            String slotKey = SLOT_KEY_PREFIX + telescopeId + ":" + 
                            date.toString() + ":" + time.toString();

            boolean available = Boolean.FALSE.equals(redisTemplate.hasKey(slotKey));
            
            SlotInfo slotInfo = new SlotInfo();
            slotInfo.setStartTime(slotStart);
            slotInfo.setEndTime(slotEnd);
            slotInfo.setAvailable(available);

            if (!available) {
                Object slotData = redisTemplate.opsForValue().get(slotKey);
                if (slotData instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) slotData;
                    slotInfo.setBookedBy((String) data.get("userName"));
                    slotInfo.setBookingId(data.get("bookingId") != null ? 
                            data.get("bookingId").toString() : null);
                }
            }

            slots.add(slotInfo);
            time = time.plusMinutes(slotMinutes);
        }

        return slots;
    }

    public boolean checkSlotsAvailable(Long telescopeId, LocalDateTime startTime, LocalDateTime endTime) {
        List<LocalDateTime> slotStarts = getSlotStartsInRange(startTime, endTime);
        
        for (LocalDateTime slotStart : slotStarts) {
            if (!isSlotAvailable(telescopeId, slotStart)) {
                return false;
            }
        }
        return true;
    }

    public void occupySlots(Long telescopeId, Booking booking) {
        List<LocalDateTime> slotStarts = getSlotStartsInRange(
                booking.getStartTime(), booking.getEndTime());
        
        for (LocalDateTime slotStart : slotStarts) {
            markSlotOccupied(telescopeId, slotStart, booking);
        }
    }

    public void releaseSlots(Long telescopeId, LocalDateTime startTime, LocalDateTime endTime) {
        List<LocalDateTime> slotStarts = getSlotStartsInRange(startTime, endTime);
        
        for (LocalDateTime slotStart : slotStarts) {
            markSlotAvailable(telescopeId, slotStart);
        }
    }

    private List<LocalDateTime> getSlotStartsInRange(LocalDateTime startTime, LocalDateTime endTime) {
        List<LocalDateTime> slots = new ArrayList<>();
        
        int slotMinutes = appConfig.getBooking().getSlotMinutes();
        
        LocalDateTime current = roundDownToSlot(startTime, slotMinutes);
        
        while (current.isBefore(endTime)) {
            slots.add(current);
            current = current.plusMinutes(slotMinutes);
        }
        
        return slots;
    }

    private LocalDateTime roundDownToSlot(LocalDateTime time, int slotMinutes) {
        int minutes = time.getMinute();
        int roundedMinutes = (minutes / slotMinutes) * slotMinutes;
        return time.withMinute(roundedMinutes).withSecond(0).withNano(0);
    }
}
