package com.company.watermonitor.service;

import com.company.watermonitor.dto.DeliveryOrderDTO;
import com.company.watermonitor.entity.DeliveryOrder;
import com.company.watermonitor.entity.WaterMachine;
import com.company.watermonitor.repository.DeliveryOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryOrderService {

    private final DeliveryOrderRepository orderRepository;
    private final WaterMachineService machineService;

    public void checkAndCreateOrder(Long machineId, Double remainingLiters) {
        log.info("[工单合并调试] 收到单机器工单请求 - machineId: {}, 剩余水量: {}L", machineId, remainingLiters);
        
        WaterMachine machine = machineService.getMachineById(machineId);
        if (machine == null) {
            log.warn("[工单合并调试] 找不到机器信息 - machineId: {}", machineId);
            return;
        }
        
        Integer floor = machine.getFloor();
        log.info("[工单合并调试] 机器所在楼层: {}楼", floor);
        
        Optional<DeliveryOrder> existingPending = orderRepository.findFirstByFloorAndStatusOrderByOrderTimeDesc(floor, "PENDING");
        
        if (existingPending.isPresent()) {
            DeliveryOrder order = existingPending.get();
            log.info("[工单合并调试] 找到待处理工单 - orderId: {}, 当前机器数: {}", order.getOrderId(), order.getMachineCount());
            
            List<Long> existingMachineIds = order.getMachineIds();
            if (existingMachineIds.contains(machineId)) {
                log.info("[工单合并调试] 机器 {} 已在工单中，跳过", machineId);
                return;
            }
            
            List<Long> newMachineIds = new ArrayList<>(existingMachineIds);
            newMachineIds.add(machineId);
            
            List<Double> existingLiters = order.getRemainingLitersList();
            List<Double> newLiters = new ArrayList<>(existingLiters);
            newLiters.add(remainingLiters);
            
            order.setMachineIds(newMachineIds);
            order.setRemainingLitersList(newLiters);
            order.setRemainingLiters(order.getMinRemainingLiters());
            order.setMachineCount(newMachineIds.size());
            
            orderRepository.save(order);
            log.info("[工单合并调试] 工单合并成功! 合并后机器数: {}, 所有机器ID: {}", newMachineIds.size(), newMachineIds);
            return;
        }
        
        log.info("[工单合并调试] 该楼层无待处理工单，创建新工单");
        DeliveryOrder order = new DeliveryOrder();
        order.setMachineId(machineId);
        order.setFloor(floor);
        order.setRemainingLiters(remainingLiters);
        order.setStatus("PENDING");
        order.setOrderTime(LocalDateTime.now());
        order.setMachineIds(List.of(machineId));
        order.setRemainingLitersList(List.of(remainingLiters));
        order.setMachineCount(1);
        
        DeliveryOrder saved = orderRepository.save(order);
        log.info("[工单合并调试] 新工单创建成功 - orderId: {}", saved.getOrderId());
    }

    public void createBatchOrders(Map<Long, Double> lowWaterMachines) {
        log.info("[工单合并调试] ========== 批量处理开始 ==========");
        log.info("[工单合并调试] 低水位机器总数: {}", lowWaterMachines.size());
        
        Map<Integer, Map<Long, Double>> machinesByFloor = new HashMap<>();
        
        for (Map.Entry<Long, Double> entry : lowWaterMachines.entrySet()) {
            Long machineId = entry.getKey();
            Double remainingLiters = entry.getValue();
            
            WaterMachine machine = machineService.getMachineById(machineId);
            if (machine == null) {
                continue;
            }
            
            Integer floor = machine.getFloor();
            machinesByFloor.computeIfAbsent(floor, k -> new HashMap<>()).put(machineId, remainingLiters);
        }
        
        log.info("[工单合并调试] 按楼层分组结果: {} 个楼层有低水位机器", machinesByFloor.size());
        
        for (Map.Entry<Integer, Map<Long, Double>> floorEntry : machinesByFloor.entrySet()) {
            Integer floor = floorEntry.getKey();
            Map<Long, Double> floorMachines = floorEntry.getValue();
            
            log.info("[工单合并调试] 处理 {} 楼，低水位机器数: {}", floor, floorMachines.size());
            
            Optional<DeliveryOrder> existingPending = orderRepository.findFirstByFloorAndStatusOrderByOrderTimeDesc(floor, "PENDING");
            
            if (existingPending.isPresent()) {
                DeliveryOrder order = existingPending.get();
                log.info("[工单合并调试] 找到待处理工单 - orderId: {}", order.getOrderId());
                
                List<Long> existingIds = order.getMachineIds();
                List<Double> existingLiters = order.getRemainingLitersList();
                boolean updated = false;
                
                for (Map.Entry<Long, Double> machineEntry : floorMachines.entrySet()) {
                    Long machineId = machineEntry.getKey();
                    Double remainingLiters = machineEntry.getValue();
                    
                    if (!existingIds.contains(machineId)) {
                        existingIds = new ArrayList<>(existingIds);
                        existingIds.add(machineId);
                        existingLiters = new ArrayList<>(existingLiters);
                        existingLiters.add(remainingLiters);
                        updated = true;
                        log.info("[工单合并调试] 新增机器 {} 到工单", machineId);
                    }
                }
                
                if (updated) {
                    order.setMachineIds(existingIds);
                    order.setRemainingLitersList(existingLiters);
                    order.setRemainingLiters(order.getMinRemainingLiters());
                    order.setMachineCount(existingIds.size());
                    orderRepository.save(order);
                    log.info("[工单合并调试] 工单合并完成 - 机器数: {}", existingIds.size());
                }
            } else {
                log.info("[工单合并调试] {} 楼无待处理工单，创建合并工单", floor);
                createMergedOrder(floor, floorMachines);
            }
        }
        
        log.info("[工单合并调试] ========== 批量处理完成 ==========");
    }

    private void createMergedOrder(Integer floor, Map<Long, Double> floorMachines) {
        List<Long> machineIds = new ArrayList<>(floorMachines.keySet());
        List<Double> remainingLitersList = new ArrayList<>(floorMachines.values());
        Double minLiters = remainingLitersList.stream().min(Double::compareTo).orElse(0.0);
        Long firstMachineId = machineIds.isEmpty() ? null : machineIds.get(0);
        
        DeliveryOrder order = new DeliveryOrder();
        order.setMachineId(firstMachineId);
        order.setFloor(floor);
        order.setRemainingLiters(minLiters);
        order.setStatus("PENDING");
        order.setOrderTime(LocalDateTime.now());
        order.setMachineIds(machineIds);
        order.setRemainingLitersList(remainingLitersList);
        order.setMachineCount(machineIds.size());
        
        DeliveryOrder saved = orderRepository.save(order);
        log.info("[工单合并调试] 创建合并工单 - orderId: {}, 楼层: {}楼, 机器数: {}, 机器ID: {}", 
                saved.getOrderId(), floor, machineIds.size(), machineIds);
    }

    public DeliveryOrder createOrder(Long machineId, Double remainingLiters) {
        WaterMachine machine = machineService.getMachineById(machineId);
        Integer floor = machine != null ? machine.getFloor() : 0;
        
        DeliveryOrder order = new DeliveryOrder();
        order.setMachineId(machineId);
        order.setFloor(floor);
        order.setRemainingLiters(remainingLiters);
        order.setStatus("PENDING");
        order.setOrderTime(LocalDateTime.now());
        order.setMachineIds(List.of(machineId));
        order.setRemainingLitersList(List.of(remainingLiters));
        order.setMachineCount(1);
        
        return orderRepository.save(order);
    }

    public DeliveryOrder deliverOrder(Long orderId) {
        Optional<DeliveryOrder> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) {
            return null;
        }
        
        DeliveryOrder order = optionalOrder.get();
        List<Long> machineIds = order.getMachineIds();
        
        log.info("[工单完成] 开始完成工单 - orderId: {}, 需要加水的机器数: {}", orderId, machineIds.size());
        
        for (Long machineId : machineIds) {
            log.info("[工单完成] 正在为机器 {} 加水", machineId);
            machineService.refilMachine(machineId);
        }
        
        order.setStatus("COMPLETED");
        order.setDeliveredTime(LocalDateTime.now());
        
        DeliveryOrder saved = orderRepository.save(order);
        log.info("[工单完成] 工单完成 - orderId: {}, 加水机器数: {}", saved.getOrderId(), machineIds.size());
        
        return saved;
    }

    public List<DeliveryOrder> getAllOrders() {
        return orderRepository.findAllByOrderByOrderTimeDesc();
    }

    public List<DeliveryOrder> getPendingOrders() {
        return orderRepository.findByStatusOrderByOrderTimeDesc("PENDING");
    }

    public List<DeliveryOrderDTO> getOrdersWithDetails() {
        List<DeliveryOrder> orders = getAllOrders();
        return orders.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<Long> getResponseTimeDistribution() {
        List<DeliveryOrder> completedOrders = orderRepository.findAllCompletedOrders();
        
        return completedOrders.stream()
                .map(this::calculateResponseTime)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getResponseTimeHistogram() {
        List<Long> responseTimes = getResponseTimeDistribution();
        
        Map<String, Long> histogram = new LinkedHashMap<>();
        histogram.put("0-5分钟", 0L);
        histogram.put("5-10分钟", 0L);
        histogram.put("10-15分钟", 0L);
        histogram.put("15-20分钟", 0L);
        histogram.put("20-30分钟", 0L);
        histogram.put("30分钟以上", 0L);
        
        for (Long time : responseTimes) {
            if (time <= 5) {
                histogram.put("0-5分钟", histogram.get("0-5分钟") + 1);
            } else if (time <= 10) {
                histogram.put("5-10分钟", histogram.get("5-10分钟") + 1);
            } else if (time <= 15) {
                histogram.put("10-15分钟", histogram.get("10-15分钟") + 1);
            } else if (time <= 20) {
                histogram.put("15-20分钟", histogram.get("15-20分钟") + 1);
            } else if (time <= 30) {
                histogram.put("20-30分钟", histogram.get("20-30分钟") + 1);
            } else {
                histogram.put("30分钟以上", histogram.get("30分钟以上") + 1);
            }
        }
        
        return histogram;
    }

    private DeliveryOrderDTO toDTO(DeliveryOrder order) {
        DeliveryOrderDTO dto = new DeliveryOrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setMachineId(order.getMachineId());
        dto.setFloor(order.getFloor());
        dto.setOrderTime(order.getOrderTime());
        dto.setDeliveredTime(order.getDeliveredTime());
        dto.setStatus(order.getStatus());
        dto.setRemainingLiters(order.getRemainingLiters());
        dto.setMachineCount(order.getMachineCount());
        
        List<Long> machineIds = order.getMachineIds();
        dto.setMachineIds(machineIds);
        dto.setRemainingLitersList(order.getRemainingLitersList());
        
        List<String> locations = new ArrayList<>();
        for (Long machineId : machineIds) {
            WaterMachine machine = machineService.getMachineById(machineId);
            if (machine != null) {
                locations.add(machine.getLocation());
                if (dto.getLocation() == null) {
                    dto.setLocation(machine.getLocation());
                }
            }
        }
        dto.setMachineLocations(locations);
        
        if (order.getDeliveredTime() != null) {
            dto.setResponseTimeMinutes(calculateResponseTime(order));
        }
        
        return dto;
    }

    private Long calculateResponseTime(DeliveryOrder order) {
        if (order.getOrderTime() == null || order.getDeliveredTime() == null) {
            return null;
        }
        return Duration.between(order.getOrderTime(), order.getDeliveredTime()).toMinutes();
    }
}
