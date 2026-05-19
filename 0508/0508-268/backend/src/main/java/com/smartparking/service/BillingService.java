package com.smartparking.service;

import com.smartparking.entity.BillingOrder;
import com.smartparking.entity.RateConfig;
import com.smartparking.entity.VehicleEntry;
import com.smartparking.exception.BusinessException;
import com.smartparking.repository.BillingOrderRepository;
import com.smartparking.repository.RateConfigRepository;
import com.smartparking.repository.VehicleEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingOrderRepository billingOrderRepository;
    private final RateConfigRepository rateConfigRepository;
    private final VehicleEntryRepository vehicleEntryRepository;

    public BigDecimal calculateParkingFee(Long parkingLotId, LocalDateTime entryTime, LocalDateTime exitTime) {
        List<RateConfig> rateConfigs = rateConfigRepository.findByParkingLotIdAndStatus(parkingLotId, "ACTIVE");
        if (rateConfigs.isEmpty()) {
            rateConfigs = rateConfigRepository.findByParkingLotIdIsNullAndStatus("ACTIVE");
        }
        if (rateConfigs.isEmpty()) {
            throw new BusinessException("费率配置不存在");
        }

        long totalMinutes = java.time.Duration.between(entryTime, exitTime).toMinutes();
        
        RateConfig defaultRate = rateConfigs.get(0);
        if (totalMinutes <= defaultRate.getFreeMinutes()) {
            return BigDecimal.ZERO;
        }

        totalMinutes -= defaultRate.getFreeMinutes();
        BigDecimal totalFee = BigDecimal.ZERO;
        LocalDateTime current = entryTime.plusMinutes(defaultRate.getFreeMinutes());

        while (current.isBefore(exitTime)) {
            LocalDateTime dayEnd = LocalDateTime.of(current.toLocalDate(), LocalTime.MAX);
            LocalDateTime periodEnd = dayEnd.isBefore(exitTime) ? dayEnd : exitTime;

            boolean isHoliday = isHoliday(current);
            long periodMinutes = java.time.Duration.between(current, periodEnd).toMinutes();

            BigDecimal periodFee = calculatePeriodFee(rateConfigs, current, periodMinutes, isHoliday);
            totalFee = totalFee.add(periodFee);

            BigDecimal maxDailyFee = getMaxDailyFee(rateConfigs, isHoliday);
            if (totalFee.compareTo(maxDailyFee) > 0) {
                totalFee = maxDailyFee;
                break;
            }

            current = periodEnd.plusSeconds(1);
        }

        return totalFee.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePeriodFee(List<RateConfig> rateConfigs, LocalDateTime time, long minutes, boolean isHoliday) {
        LocalTime localTime = time.toLocalTime();
        RateConfig applicableRate = null;

        if (isHoliday) {
            applicableRate = rateConfigs.stream()
                    .filter(r -> "HOLIDAY".equals(r.getRateType()))
                    .findFirst()
                    .orElse(null);
        }

        if (applicableRate == null) {
            for (RateConfig rate : rateConfigs) {
                if ("HOLIDAY".equals(rate.getRateType())) continue;
                LocalTime startTime = LocalTime.parse(rate.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime endTime = LocalTime.parse(rate.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));
                
                if (startTime.isBefore(endTime)) {
                    if (!localTime.isBefore(startTime) && localTime.isBefore(endTime)) {
                        applicableRate = rate;
                        break;
                    }
                } else {
                    if (!localTime.isBefore(startTime) || localTime.isBefore(endTime)) {
                        applicableRate = rate;
                        break;
                    }
                }
            }
        }

        if (applicableRate == null) {
            applicableRate = rateConfigs.get(0);
        }

        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        return hours.multiply(applicableRate.getPricePerHour());
    }

    private BigDecimal getMaxDailyFee(List<RateConfig> rateConfigs, boolean isHoliday) {
        if (isHoliday) {
            return rateConfigs.stream()
                    .filter(r -> "HOLIDAY".equals(r.getRateType()))
                    .map(RateConfig::getMaxDailyFee)
                    .findFirst()
                    .orElse(BigDecimal.valueOf(100));
        }
        return rateConfigs.stream()
                .filter(r -> !"HOLIDAY".equals(r.getRateType()))
                .map(RateConfig::getMaxDailyFee)
                .findFirst()
                .orElse(BigDecimal.valueOf(100));
    }

    private boolean isHoliday(LocalDateTime dateTime) {
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
    }

    @Transactional
    public BillingOrder createOrder(Long entryId) {
        VehicleEntry entry = vehicleEntryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException("入场记录不存在"));

        BillingOrder order = new BillingOrder();
        order.setOrderNo(generateOrderNo());
        order.setEntryId(entryId);
        order.setPlateNumber(entry.getPlateNumber());
        order.setParkingLotId(entry.getParkingLotId());
        order.setEntryTime(entry.getEntryTime());
        order.setOrderStatus("PENDING");
        order.setTotalAmount(BigDecimal.ZERO);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);

        return billingOrderRepository.save(order);
    }

    @Transactional
    public BillingOrder finalizeOrder(Long orderId, LocalDateTime exitTime) {
        BillingOrder order = billingOrderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new BusinessException("订单不存在"));

        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new BusinessException("订单状态不允许结算");
        }

        VehicleEntry entry = vehicleEntryRepository.findById(order.getEntryId())
                .orElseThrow(() -> new BusinessException("入场记录不存在"));

        BigDecimal totalAmount = calculateParkingFee(order.getParkingLotId(), order.getEntryTime(), exitTime);
        long durationMinutes = java.time.Duration.between(order.getEntryTime(), exitTime).toMinutes();

        order.setExitTime(exitTime);
        order.setParkingDuration((int) durationMinutes);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus("UNPAID");

        entry.setExitTime(exitTime);
        entry.setStatus("COMPLETED");
        vehicleEntryRepository.save(entry);

        return billingOrderRepository.save(order);
    }

    @Transactional
    public BillingOrder payOrder(Long orderId, String payMethod) {
        BillingOrder order = billingOrderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new BusinessException("订单不存在"));

        if ("PAID".equals(order.getOrderStatus())) {
            throw new BusinessException("订单已支付");
        }

        if (!"UNPAID".equals(order.getOrderStatus())) {
            throw new BusinessException("订单状态不允许支付");
        }

        order.setPaidAmount(order.getTotalAmount());
        order.setPayTime(LocalDateTime.now());
        order.setPayMethod(payMethod);
        order.setTransactionId(UUID.randomUUID().toString().replace("-", ""));
        order.setOrderStatus("PAID");

        return billingOrderRepository.save(order);
    }

    public List<BillingOrder> getUnpaidOrders(String plateNumber) {
        return billingOrderRepository.findByPlateNumberAndOrderStatus(plateNumber, "UNPAID");
    }

    public BigDecimal getRevenue(Long parkingLotId, LocalDateTime start, LocalDateTime end) {
        return billingOrderRepository.sumRevenueByParkingLotAndTime(parkingLotId, start, end);
    }

    private String generateOrderNo() {
        return "PK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
