package com.smartparking.controller;

import com.smartparking.common.Result;
import com.smartparking.entity.*;
import com.smartparking.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/parking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ParkingController {

    private final ParkingService parkingService;
    private final ParkingSpaceService parkingSpaceService;
    private final ParkingLotService parkingLotService;
    private final BillingService billingService;
    private final StatisticsService statisticsService;

    @PostMapping("/entry")
    public Result<VehicleEntry> vehicleEntry(@RequestParam Long parkingLotId,
                                             @RequestParam(required = false) Long spaceId,
                                             @RequestParam String plateNumber) {
        VehicleEntry entry = parkingService.vehicleEntry(parkingLotId, spaceId, plateNumber);
        return Result.success("入场成功", entry);
    }

    @PostMapping("/exit")
    public Result<BillingOrder> vehicleExit(@RequestParam String plateNumber) {
        BillingOrder order = parkingService.vehicleExit(plateNumber);
        return Result.success("离场成功", order);
    }

    @PostMapping("/manual-release")
    public Result<BillingOrder> manualRelease(@RequestParam Long entryId,
                                              @RequestParam(required = false) String remark) {
        BillingOrder order = parkingService.manualRelease(entryId, remark);
        return Result.success("放行成功", order);
    }

    @GetMapping("/current/{plateNumber}")
    public Result<VehicleEntry> getCurrentParking(@PathVariable String plateNumber) {
        VehicleEntry entry = parkingService.getCurrentParking(plateNumber);
        return Result.success(entry);
    }

    @GetMapping("/vehicles/{parkingLotId}")
    public Result<List<VehicleEntry>> getParkingVehicles(@PathVariable Long parkingLotId) {
        List<VehicleEntry> vehicles = parkingService.getParkingVehicles(parkingLotId);
        return Result.success(vehicles);
    }

    @GetMapping("/spaces/{parkingLotId}")
    public Result<List<ParkingSpace>> getParkingSpaces(@PathVariable Long parkingLotId) {
        List<ParkingSpace> spaces = parkingSpaceService.getSpacesByParkingLot(parkingLotId);
        return Result.success(spaces);
    }

    @PutMapping("/space/{spaceId}/status")
    public Result<Void> updateSpaceStatus(@PathVariable Long spaceId, @RequestParam String status) {
        parkingSpaceService.updateSpaceStatus(spaceId, status);
        return Result.success();
    }

    @GetMapping("/lots")
    public Result<List<ParkingLot>> getAllParkingLots() {
        List<ParkingLot> lots = parkingLotService.getAllParkingLots();
        return Result.success(lots);
    }

    @GetMapping("/lot/{id}")
    public Result<ParkingLot> getParkingLotById(@PathVariable Long id) {
        ParkingLot lot = parkingLotService.getParkingLotById(id);
        return Result.success(lot);
    }

    @GetMapping("/order/unpaid/{plateNumber}")
    public Result<List<BillingOrder>> getUnpaidOrders(@PathVariable String plateNumber) {
        List<BillingOrder> orders = billingService.getUnpaidOrders(plateNumber);
        return Result.success(orders);
    }

    @PostMapping("/order/{orderId}/pay")
    public Result<BillingOrder> payOrder(@PathVariable Long orderId, @RequestParam String payMethod) {
        BillingOrder order = billingService.payOrder(orderId, payMethod);
        return Result.success("支付成功", order);
    }

    @GetMapping("/calculate-fee")
    public Result<BigDecimal> calculateFee(@RequestParam Long parkingLotId,
                                           @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime entryTime,
                                           @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime exitTime) {
        BigDecimal fee = billingService.calculateParkingFee(parkingLotId, entryTime, exitTime);
        return Result.success(fee);
    }

    @GetMapping("/statistics/dashboard")
    public Result<Map<String, Object>> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalParkingLots", parkingLotService.getAllParkingLots().size());
        stats.put("todayOrders", statisticsService.getTodayOrderCount());
        stats.put("todayRevenue", statisticsService.getTodayRevenue());
        stats.put("currentParkingVehicles", statisticsService.getCurrentParkingCount());
        stats.put("parkingLotStats", statisticsService.getParkingLotStatistics());
        return Result.success(stats);
    }

    @GetMapping("/statistics/heatmap")
    public Result<List<Map<String, Object>>> getHeatmapData() {
        List<Map<String, Object>> heatmapData = statisticsService.getHeatmapData();
        return Result.success(heatmapData);
    }

    @GetMapping("/statistics/peak")
    public Result<Map<String, Object>> getPeakStatistics(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime end) {
        Map<String, Object> peakData = statisticsService.getPeakStatistics(start, end);
        return Result.success(peakData);
    }

    @GetMapping("/statistics/revenue")
    public Result<BigDecimal> getRevenue(
            @RequestParam Long parkingLotId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime end) {
        BigDecimal revenue = billingService.getRevenue(parkingLotId, start, end);
        return Result.success(revenue);
    }
}
