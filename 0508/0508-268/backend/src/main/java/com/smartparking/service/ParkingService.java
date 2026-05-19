package com.smartparking.service;

import com.smartparking.entity.BillingOrder;
import com.smartparking.entity.ParkingSpace;
import com.smartparking.entity.VehicleEntry;
import com.smartparking.exception.BusinessException;
import com.smartparking.repository.ParkingLotRepository;
import com.smartparking.repository.ParkingSpaceRepository;
import com.smartparking.repository.VehicleEntryRepository;
import com.smartparking.websocket.ParkingWebSocketServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingService {

    private final VehicleEntryRepository vehicleEntryRepository;
    private final ParkingSpaceRepository parkingSpaceRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final BillingService billingService;
    private final ParkingWebSocketServer webSocketServer;

    @Transactional
    public VehicleEntry vehicleEntry(Long parkingLotId, Long spaceId, String plateNumber) {
        Optional<VehicleEntry> existingEntry = vehicleEntryRepository.findByPlateNumberAndStatus(plateNumber, "PARKING");
        if (existingEntry.isPresent()) {
            throw new BusinessException("车辆已在场");
        }

        String area = null;
        String spaceNo = null;

        if (spaceId != null) {
            ParkingSpace space = parkingSpaceRepository.findById(spaceId)
                    .orElseThrow(() -> new BusinessException("车位不存在"));
            
            if (!"AVAILABLE".equals(space.getStatus())) {
                throw new BusinessException("车位不可用");
            }

            area = space.getArea();
            spaceNo = space.getSpaceNo();
            
            space.setStatus("OCCUPIED");
            space.setPlateNumber(plateNumber);
            space.setOccupyTime(LocalDateTime.now());
            parkingSpaceRepository.save(space);
            
            webSocketServer.broadcastParkingSpaceUpdate(parkingLotId, spaceId, "OCCUPIED", area, spaceNo, plateNumber);
        }

        VehicleEntry entry = new VehicleEntry();
        entry.setParkingLotId(parkingLotId);
        entry.setSpaceId(spaceId);
        entry.setPlateNumber(plateNumber);
        entry.setEntryTime(LocalDateTime.now());
        entry.setStatus("PARKING");
        
        entry = vehicleEntryRepository.save(entry);
        
        billingService.createOrder(entry.getId());
        
        webSocketServer.broadcastVehicleEntry(parkingLotId, plateNumber, spaceId, entry.getEntryTime().toString());
        
        log.info("车辆入场: {}", plateNumber);
        return entry;
    }

    @Transactional
    public BillingOrder vehicleExit(String plateNumber) {
        VehicleEntry entry = vehicleEntryRepository.findByPlateNumberAndStatus(plateNumber, "PARKING")
                .orElseThrow(() -> new BusinessException("车辆不在场"));

        LocalDateTime exitTime = LocalDateTime.now();
        String area = null;
        String spaceNo = null;

        if (entry.getSpaceId() != null) {
            ParkingSpace space = parkingSpaceRepository.findById(entry.getSpaceId()).orElse(null);
            if (space != null) {
                area = space.getArea();
                spaceNo = space.getSpaceNo();
                space.setStatus("AVAILABLE");
                space.setPlateNumber(null);
                space.setOccupyTime(null);
                parkingSpaceRepository.save(space);
                webSocketServer.broadcastParkingSpaceUpdate(entry.getParkingLotId(), entry.getSpaceId(), "AVAILABLE", area, spaceNo, null);
            }
        }

        List<BillingOrder> orders = billingService.getUnpaidOrders(plateNumber);
        if (orders.isEmpty()) {
            throw new BusinessException("未找到待支付订单");
        }

        BillingOrder order = orders.get(0);
        order = billingService.finalizeOrder(order.getId(), exitTime);

        webSocketServer.broadcastVehicleExit(entry.getParkingLotId(), plateNumber, order.getTotalAmount().toString(), entry.getSpaceId());

        log.info("车辆离场: {}, 费用: {}", plateNumber, order.getTotalAmount());
        return order;
    }

    @Transactional
    public BillingOrder manualRelease(Long entryId, String remark) {
        VehicleEntry entry = vehicleEntryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException("入场记录不存在"));

        LocalDateTime exitTime = LocalDateTime.now();
        String area = null;
        String spaceNo = null;

        if (entry.getSpaceId() != null) {
            ParkingSpace space = parkingSpaceRepository.findById(entry.getSpaceId()).orElse(null);
            if (space != null) {
                area = space.getArea();
                spaceNo = space.getSpaceNo();
                space.setStatus("AVAILABLE");
                space.setPlateNumber(null);
                space.setOccupyTime(null);
                parkingSpaceRepository.save(space);
                webSocketServer.broadcastParkingSpaceUpdate(entry.getParkingLotId(), entry.getSpaceId(), "AVAILABLE", area, spaceNo, null);
            }
        }

        List<BillingOrder> orders = billingService.getUnpaidOrders(entry.getPlateNumber());
        BillingOrder order;
        if (!orders.isEmpty()) {
            order = orders.get(0);
            order = billingService.finalizeOrder(order.getId(), exitTime);
            order.setOrderStatus("PAID");
            order.setPaidAmount(BigDecimal.ZERO);
            order.setPayTime(exitTime);
            order.setPayMethod("MANUAL");
            order.setRemark(remark);
            order = billingService.payOrder(order.getId(), "MANUAL");
        } else {
            order = new BillingOrder();
            order.setOrderStatus("PAID");
            order.setTotalAmount(BigDecimal.ZERO);
            order.setPaidAmount(BigDecimal.ZERO);
        }

        entry.setStatus("COMPLETED");
        entry.setExitTime(exitTime);
        entry.setRemark(remark);
        vehicleEntryRepository.save(entry);

        webSocketServer.broadcastVehicleExit(entry.getParkingLotId(), entry.getPlateNumber(), "0.00", entry.getSpaceId());

        log.info("人工放行车辆: {}", entry.getPlateNumber());
        return order;
    }

    public VehicleEntry getCurrentParking(String plateNumber) {
        return vehicleEntryRepository.findByPlateNumberAndStatus(plateNumber, "PARKING").orElse(null);
    }

    public List<VehicleEntry> getParkingVehicles(Long parkingLotId) {
        return vehicleEntryRepository.findByParkingLotIdAndStatus(parkingLotId, "PARKING");
    }

    public long getParkingVehicleCount(Long parkingLotId) {
        return vehicleEntryRepository.countParkingVehicles(parkingLotId);
    }
}
