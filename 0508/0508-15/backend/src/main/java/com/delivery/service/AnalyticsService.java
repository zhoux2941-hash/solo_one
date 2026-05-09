package com.delivery.service;

import com.delivery.dto.DeliveryTimeStatsDTO;
import com.delivery.dto.OnTimeRateDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final RiderRepository riderRepository;

    public Map<String, List<OnTimeRateDTO>> getRiderOnTimeRates(int days) {
        Map<String, List<OnTimeRateDTO>> result = new LinkedHashMap<>();
        List<Rider> riders = riderRepository.findAll();

        LocalDate today = LocalDate.now();

        for (Rider rider : riders) {
            List<OnTimeRateDTO> rates = new ArrayList<>();
            for (int i = days - 1; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                double rate = calculateDailyOnTimeRate(rider.getRiderId(), date);
                rates.add(new OnTimeRateDTO(date, rate));
            }
            result.put(rider.getName(), rates);
        }

        return result;
    }

    private double calculateDailyOnTimeRate(String riderId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findOrdersBetweenDates(start, end).stream()
            .filter(o -> riderId.equals(o.getRiderId()) && o.getActualDeliveryTime() != null)
            .collect(Collectors.toList());

        if (orders.isEmpty()) {
            return 0.0;
        }

        long onTimeCount = orders.stream()
            .filter(o -> !o.getActualDeliveryTime().isAfter(o.getExpectedDeliveryTime()))
            .count();

        return (double) onTimeCount / orders.size() * 100;
    }

    public List<DeliveryTimeStatsDTO> getDeliveryTimeBoxPlot(int days) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(days - 1).atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findOrdersBetweenDates(start, end).stream()
            .filter(o -> o.getActualDeliveryTime() != null)
            .collect(Collectors.toList());

        Map<String, List<Long>> slotDurations = new LinkedHashMap<>();
        slotDurations.put("上午 (8-12)", new ArrayList<>());
        slotDurations.put("下午 (12-18)", new ArrayList<>());
        slotDurations.put("晚上 (18-22)", new ArrayList<>());
        slotDurations.put("夜间 (22-8)", new ArrayList<>());

        for (Order order : orders) {
            Duration duration = Duration.between(order.getCreatedAt(), order.getActualDeliveryTime());
            long minutes = duration.toMinutes();
            int hour = order.getCreatedAt().getHour();
            String slot = getTimeSlot(hour);
            slotDurations.get(slot).add(minutes);
        }

        List<DeliveryTimeStatsDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<Long>> entry : slotDurations.entrySet()) {
            result.add(calculateBoxPlotStats(entry.getKey(), entry.getValue()));
        }

        return result;
    }

    private String getTimeSlot(int hour) {
        if (hour >= 8 && hour < 12) {
            return "上午 (8-12)";
        } else if (hour >= 12 && hour < 18) {
            return "下午 (12-18)";
        } else if (hour >= 18 && hour < 22) {
            return "晚上 (18-22)";
        } else {
            return "夜间 (22-8)";
        }
    }

    private DeliveryTimeStatsDTO calculateBoxPlotStats(String timeSlot, List<Long> durations) {
        if (durations.isEmpty()) {
            return new DeliveryTimeStatsDTO(timeSlot, new ArrayList<>(), 0L, 0L, 0L, 0L, 0L);
        }

        Collections.sort(durations);

        long min = durations.get(0);
        long max = durations.get(durations.size() - 1);
        long median = calculatePercentile(durations, 50);
        long q1 = calculatePercentile(durations, 25);
        long q3 = calculatePercentile(durations, 75);

        return new DeliveryTimeStatsDTO(timeSlot, new ArrayList<>(durations), min, q1, median, q3, max);
    }

    private long calculatePercentile(List<Long> sortedList, double percentile) {
        if (sortedList.isEmpty()) return 0;

        double index = (percentile / 100.0) * (sortedList.size() - 1);
        int lower = (int) Math.floor(index);
        int upper = (int) Math.ceil(index);

        if (lower == upper) {
            return sortedList.get(lower);
        }

        double weight = index - lower;
        return (long) (sortedList.get(lower) * (1 - weight) + sortedList.get(upper) * weight);
    }
}
