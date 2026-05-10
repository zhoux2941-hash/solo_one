package com.charging.service;

import com.charging.dto.StatisticsDTO.*;
import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import com.charging.entity.Reservation;
import com.charging.entity.ReservationStatus;
import com.charging.repository.ChargingPileRepository;
import com.charging.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {
    
    private final ReservationRepository reservationRepository;
    private final ChargingPileRepository chargingPileRepository;
    
    private static final List<ReservationStatus> EFFECTIVE_STATUSES = Arrays.asList(
            ReservationStatus.COMPLETED,
            ReservationStatus.ACTIVE
    );
    
    public OverviewStatistics getOverviewStatistics() {
        List<ChargingPile> allPiles = chargingPileRepository.findAll();
        int totalPiles = allPiles.size();
        
        int availablePiles = (int) allPiles.stream().filter(p -> p.getStatus() == PileStatus.AVAILABLE).count();
        int occupiedPiles = (int) allPiles.stream().filter(p -> p.getStatus() == PileStatus.OCCUPIED).count();
        int maintenancePiles = (int) allPiles.stream().filter(p -> p.getStatus() == PileStatus.MAINTENANCE).count();
        
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        
        List<Reservation> todayReservations = reservationRepository.findByStatusesAndTimeRange(
                Arrays.asList(ReservationStatus.values()), startOfDay, endOfDay);
        
        int todayCompleted = (int) todayReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.COMPLETED || r.getStatus() == ReservationStatus.ACTIVE)
                .count();
        
        double todayUsageRate = calculateUsageRate(todayReservations, totalPiles, 1);
        
        List<Reservation> allReservations = reservationRepository.findByStatuses(EFFECTIVE_STATUSES);
        double averageUsageRate = calculateAverageUsageRate(allReservations, totalPiles);
        
        int[] hourlyCounts = calculateHourlyCounts(allReservations);
        LocalTime busiestHour = findHourWithMaxValue(hourlyCounts, true);
        LocalTime quietestHour = findHourWithMaxValue(hourlyCounts, false);
        
        OverviewStatistics stats = new OverviewStatistics();
        stats.setTotalPiles(totalPiles);
        stats.setAvailablePiles(availablePiles);
        stats.setOccupiedPiles(occupiedPiles);
        stats.setMaintenancePiles(maintenancePiles);
        stats.setTodayReservations(todayReservations.size());
        stats.setTodayCompletedReservations(todayCompleted);
        stats.setTodayUsageRate(Math.round(todayUsageRate * 100.0) / 100.0);
        stats.setAverageUsageRate(Math.round(averageUsageRate * 100.0) / 100.0);
        stats.setBusiestHour(busiestHour);
        stats.setQuietestHour(quietestHour);
        
        return stats;
    }
    
    public List<DailyUsage> getDailyUsageStatistics(int days) {
        List<DailyUsage> result = new ArrayList<>();
        List<ChargingPile> allPiles = chargingPileRepository.findAll();
        int totalPiles = allPiles.size();
        
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
            
            List<Reservation> dayReservations = reservationRepository.findByStatusesAndTimeRange(
                    Arrays.asList(ReservationStatus.values()), startOfDay, endOfDay);
            
            int completedCount = (int) dayReservations.stream()
                    .filter(r -> r.getStatus() == ReservationStatus.COMPLETED || r.getStatus() == ReservationStatus.ACTIVE)
                    .count();
            
            int expiredCount = (int) dayReservations.stream()
                    .filter(r -> r.getStatus() == ReservationStatus.EXPIRED)
                    .count();
            
            double usageRate = calculateUsageRate(dayReservations, totalPiles, 1);
            
            DailyUsage usage = new DailyUsage();
            usage.setDate(date);
            usage.setUsageRate(Math.round(usageRate * 100.0) / 100.0);
            usage.setTotalReservations(dayReservations.size());
            usage.setCompletedReservations(completedCount);
            usage.setExpiredReservations(expiredCount);
            
            result.add(usage);
        }
        
        return result;
    }
    
    public List<PileStatistics> getAllPileStatistics(int days) {
        List<ChargingPile> piles = chargingPileRepository.findAll();
        List<PileStatistics> result = new ArrayList<>();
        
        for (ChargingPile pile : piles) {
            PileStatistics stats = calculatePileStatistics(pile, days);
            result.add(stats);
        }
        
        return result;
    }
    
    public PileStatistics getPileStatistics(Long pileId, int days) {
        ChargingPile pile = chargingPileRepository.findById(pileId)
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
        return calculatePileStatistics(pile, days);
    }
    
    private PileStatistics calculatePileStatistics(ChargingPile pile, int days) {
        LocalDateTime startDate = LocalDate.now().minusDays(days).atStartOfDay();
        LocalDateTime endDate = LocalDateTime.now();
        
        List<Reservation> reservations = reservationRepository.findByPileIdAndStatuses(
                pile.getId(), EFFECTIVE_STATUSES);
        
        List<Reservation> dateRangeReservations = reservations.stream()
                .filter(r -> !r.getStartTime().isBefore(startDate) && !r.getStartTime().isAfter(endDate))
                .collect(Collectors.toList());
        
        List<TimeSlotUsage> timeSlotUsages = calculateTimeSlotUsage(dateRangeReservations, days);
        
        Map<Integer, Integer> hourlyCounts = new HashMap<>();
        for (TimeSlotUsage slot : timeSlotUsages) {
            hourlyCounts.merge(slot.getHour(), slot.getCount(), Integer::sum);
        }
        
        List<LocalTime> peakHours = findPeakHours(hourlyCounts, true);
        List<LocalTime> offPeakHours = findPeakHours(hourlyCounts, false);
        
        double totalUsageRate = calculateUsageRate(dateRangeReservations, 1, days);
        
        PileStatistics stats = new PileStatistics();
        stats.setPileId(pile.getId());
        stats.setPileCode(pile.getPileCode());
        stats.setLocation(pile.getLocation());
        stats.setTotalUsageRate(Math.round(totalUsageRate * 100.0) / 100.0);
        stats.setTotalReservations(dateRangeReservations.size());
        stats.setTimeSlotUsages(timeSlotUsages);
        stats.setPeakHours(peakHours);
        stats.setOffPeakHours(offPeakHours);
        
        return stats;
    }
    
    public List<HeatmapData> getHeatmapData(int days) {
        List<ChargingPile> piles = chargingPileRepository.findAll();
        List<HeatmapData> result = new ArrayList<>();
        
        for (ChargingPile pile : piles) {
            PileStatistics pileStats = calculatePileStatistics(pile, days);
            
            Map<String, Double> hourlyUsage = new LinkedHashMap<>();
            for (int hour = 0; hour < 24; hour++) {
                double rate = pileStats.getTimeSlotUsages().stream()
                        .filter(s -> s.getHour() == hour)
                        .mapToDouble(TimeSlotUsage::getUsageRate)
                        .sum();
                hourlyUsage.put(String.format("%02d:00", hour), Math.round(rate * 100.0) / 100.0);
            }
            
            HeatmapData data = new HeatmapData();
            data.setPileCode(pile.getPileCode());
            data.setHourlyUsage(hourlyUsage);
            result.add(data);
        }
        
        return result;
    }
    
    private List<TimeSlotUsage> calculateTimeSlotUsage(List<Reservation> reservations, int days) {
        Map<String, Integer> slotCounts = new HashMap<>();
        
        for (int hour = 0; hour < 24; hour++) {
            for (int minute = 0; minute < 60; minute += 30) {
                slotCounts.put(String.format("%02d:%02d", hour, minute), 0);
            }
        }
        
        for (Reservation reservation : reservations) {
            LocalDateTime time = reservation.getStartTime();
            int hour = time.getHour();
            int minute = time.getMinute() < 30 ? 0 : 30;
            String key = String.format("%02d:%02d", hour, minute);
            slotCounts.merge(key, 1, Integer::sum);
        }
        
        int maxSlotsPerDay = 48;
        double totalPossibleSlots = maxSlotsPerDay * days;
        
        return slotCounts.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split(":");
                    TimeSlotUsage usage = new TimeSlotUsage();
                    usage.setHour(Integer.parseInt(parts[0]));
                    usage.setMinute(Integer.parseInt(parts[1]));
                    usage.setCount(entry.getValue());
                    usage.setUsageRate(totalPossibleSlots > 0 ? 
                            Math.round((entry.getValue() / totalPossibleSlots) * 10000.0) / 100.0 : 0);
                    return usage;
                })
                .sorted(Comparator.comparingInt(TimeSlotUsage::getHour)
                        .thenComparingInt(TimeSlotUsage::getMinute))
                .collect(Collectors.toList());
    }
    
    private int[] calculateHourlyCounts(List<Reservation> reservations) {
        int[] counts = new int[24];
        for (Reservation reservation : reservations) {
            int hour = reservation.getStartTime().getHour();
            counts[hour]++;
        }
        return counts;
    }
    
    private LocalTime findHourWithMaxValue(int[] hourlyCounts, boolean findMax) {
        int targetIndex = 0;
        int targetValue = findMax ? -1 : Integer.MAX_VALUE;
        
        for (int i = 0; i < 24; i++) {
            if (findMax) {
                if (hourlyCounts[i] > targetValue) {
                    targetValue = hourlyCounts[i];
                    targetIndex = i;
                }
            } else {
                if (hourlyCounts[i] < targetValue) {
                    targetValue = hourlyCounts[i];
                    targetIndex = i;
                }
            }
        }
        
        return LocalTime.of(targetIndex, 0);
    }
    
    private List<LocalTime> findPeakHours(Map<Integer, Integer> hourlyCounts, boolean findPeak) {
        if (hourlyCounts.isEmpty()) {
            return Collections.emptyList();
        }
        
        int threshold;
        if (findPeak) {
            int max = Collections.max(hourlyCounts.values());
            threshold = max;
        } else {
            int min = Collections.min(hourlyCounts.values());
            threshold = min;
        }
        
        return hourlyCounts.entrySet().stream()
                .filter(entry -> entry.getValue() == threshold && entry.getValue() > 0)
                .map(entry -> LocalTime.of(entry.getKey(), 0))
                .sorted()
                .collect(Collectors.toList());
    }
    
    private double calculateUsageRate(List<Reservation> reservations, int pileCount, int days) {
        if (pileCount == 0 || days == 0) {
            return 0;
        }
        
        int effectiveReservations = (int) reservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.COMPLETED || r.getStatus() == ReservationStatus.ACTIVE)
                .count();
        
        int slotsPerDay = 48;
        double totalSlots = pileCount * slotsPerDay * days;
        
        return totalSlots > 0 ? (effectiveReservations / totalSlots) * 100 : 0;
    }
    
    private double calculateAverageUsageRate(List<Reservation> reservations, int pileCount) {
        if (reservations.isEmpty() || pileCount == 0) {
            return 0;
        }
        
        LocalDate minDate = reservations.stream()
                .map(r -> r.getStartTime().toLocalDate())
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());
        LocalDate maxDate = LocalDate.now();
        int days = (int) Duration.between(minDate.atStartOfDay(), maxDate.atStartOfDay()).toDays() + 1;
        
        return calculateUsageRate(reservations, pileCount, days);
    }
}
