package com.company.grouporder.service;

import com.company.grouporder.dto.stats.*;
import com.company.grouporder.entity.GroupOrder;
import com.company.grouporder.entity.OrderItem;
import com.company.grouporder.entity.Participant;
import com.company.grouporder.repository.GroupOrderRepository;
import com.company.grouporder.repository.OrderItemRepository;
import com.company.grouporder.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsService {

    private final GroupOrderRepository groupOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ParticipantRepository participantRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public List<MonthlyStats> getMonthlyOrderStats(int months) {
        List<MonthlyStats> result = new ArrayList<>();
        YearMonth now = YearMonth.now();
        
        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.atEndOfMonth().atTime(23, 59, 59);
            
            List<GroupOrder> orders = getEndedOrdersInRange(start, end);
            
            int orderCount = orders.size();
            BigDecimal totalAmount = orders.stream()
                    .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal finalAmount = orders.stream()
                    .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            result.add(new MonthlyStats(month.format(MONTH_FORMATTER), orderCount, totalAmount, finalAmount));
        }
        
        return result;
    }

    public List<UserMonthlyStats> getUserMonthlyStats(String userId, int months) {
        List<UserMonthlyStats> result = new ArrayList<>();
        YearMonth now = YearMonth.now();
        
        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.atEndOfMonth().atTime(23, 59, 59);
            
            List<GroupOrder> allOrders = getEndedOrdersInRange(start, end);
            
            int initiateCount = (int) allOrders.stream()
                    .filter(o -> userId.equals(o.getInitiatorUserId()))
                    .count();
            
            List<Long> orderIdsInRange = allOrders.stream()
                    .map(GroupOrder::getId)
                    .collect(Collectors.toList());
            
            List<OrderItem> userItems = getOrderItemsInOrdersAndUser(orderIdsInRange, userId);
            Set<Long> participatedOrderIds = userItems.stream()
                    .map(OrderItem::getGroupOrderId)
                    .collect(Collectors.toSet());
            
            BigDecimal totalContribution = userItems.stream()
                    .map(item -> item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal finalContribution = userItems.stream()
                    .map(item -> item.getFinalPrice() != null ? item.getFinalPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            result.add(new UserMonthlyStats(
                    month.format(MONTH_FORMATTER),
                    participatedOrderIds.size(),
                    initiateCount,
                    totalContribution,
                    finalContribution
            ));
        }
        
        return result;
    }

    public List<UserRanking> getUserRanking(int limit) {
        List<GroupOrder> allEndedOrders = getEndedOrdersInRange(
                LocalDateTime.of(2020, 1, 1, 0, 0),
                LocalDateTime.now()
        );
        
        Map<String, UserStatsData> userStats = new LinkedHashMap<>();
        
        for (GroupOrder order : allEndedOrders) {
            String initiatorId = order.getInitiatorUserId();
            String initiatorName = order.getInitiatorName();
            
            userStats.computeIfAbsent(initiatorId, k -> new UserStatsData(initiatorName))
                    .incrInitiateCount();
            
            List<OrderItem> items = orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(order.getId());
            Map<String, BigDecimal> userTotals = new HashMap<>();
            Map<String, BigDecimal> userFinals = new HashMap<>();
            Set<String> participants = new HashSet<>();
            
            for (OrderItem item : items) {
                String userId = item.getParticipantUserId();
                String userName = item.getParticipantName();
                participants.add(userId);
                
                userStats.computeIfAbsent(userId, k -> new UserStatsData(userName));
                
                userTotals.merge(userId, 
                        item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO, 
                        BigDecimal::add);
                userFinals.merge(userId, 
                        item.getFinalPrice() != null ? item.getFinalPrice() : BigDecimal.ZERO, 
                        BigDecimal::add);
            }
            
            for (String userId : participants) {
                UserStatsData data = userStats.get(userId);
                if (data != null) {
                    data.incrParticipateCount();
                    data.addTotal(userTotals.getOrDefault(userId, BigDecimal.ZERO));
                    data.addFinal(userFinals.getOrDefault(userId, BigDecimal.ZERO));
                }
            }
        }
        
        List<UserRanking> rankings = new ArrayList<>();
        for (Map.Entry<String, UserStatsData> entry : userStats.entrySet()) {
            UserStatsData data = entry.getValue();
            rankings.add(new UserRanking(
                    entry.getKey(),
                    data.getUserName(),
                    data.getParticipateCount(),
                    data.getInitiateCount(),
                    data.getTotalAmount(),
                    data.getFinalAmount()
            ));
        }
        
        rankings.sort((a, b) -> b.getFinalAmount().compareTo(a.getFinalAmount()));
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }
        
        return limit > 0 ? rankings.stream().limit(limit).collect(Collectors.toList()) : rankings;
    }

    public List<DepartmentRanking> getDepartmentRanking(int limit) {
        List<UserRanking> userRankings = getUserRanking(0);
        
        Map<String, DepartmentStatsData> deptStats = new LinkedHashMap<>();
        
        for (UserRanking user : userRankings) {
            String dept = extractDepartment(user.getUserId());
            
            DepartmentStatsData data = deptStats.computeIfAbsent(dept, 
                    k -> new DepartmentStatsData(dept));
            
            data.addUser();
            data.addParticipateCount(user.getParticipateCount());
            data.addInitiateCount(user.getInitiateCount());
            data.addTotal(user.getTotalAmount());
            data.addFinal(user.getFinalAmount());
        }
        
        List<DepartmentRanking> rankings = new ArrayList<>();
        for (DepartmentStatsData data : deptStats.values()) {
            rankings.add(new DepartmentRanking(
                    data.getDepartment(),
                    data.getUserCount(),
                    data.getParticipateCount(),
                    data.getInitiateCount(),
                    data.getTotalAmount(),
                    data.getFinalAmount()
            ));
        }
        
        rankings.sort((a, b) -> b.getFinalAmount().compareTo(a.getFinalAmount()));
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }
        
        return limit > 0 ? rankings.stream().limit(limit).collect(Collectors.toList()) : rankings;
    }

    public Map<String, Object> getPersonalSummary(String userId, String userName) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        List<GroupOrder> allOrders = getEndedOrdersInRange(
                LocalDateTime.of(2020, 1, 1, 0, 0),
                LocalDateTime.now()
        );
        
        long totalInitiated = allOrders.stream()
                .filter(o -> userId.equals(o.getInitiatorUserId()))
                .count();
        
        List<Long> allOrderIds = allOrders.stream().map(GroupOrder::getId).collect(Collectors.toList());
        List<OrderItem> userItems = getOrderItemsInOrdersAndUser(allOrderIds, userId);
        
        Set<Long> participatedOrderIds = userItems.stream()
                .map(OrderItem::getGroupOrderId)
                .collect(Collectors.toSet());
        
        BigDecimal totalSpent = userItems.stream()
                .map(item -> item.getFinalPrice() != null ? item.getFinalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalOriginal = userItems.stream()
                .map(item -> item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSaved = totalOriginal.subtract(totalSpent);
        
        long totalItems = userItems.size();
        
        result.put("userId", userId);
        result.put("userName", userName);
        result.put("totalInitiated", totalInitiated);
        result.put("totalParticipated", participatedOrderIds.size());
        result.put("totalSpent", totalSpent);
        result.put("totalSaved", totalSaved);
        result.put("totalItems", totalItems);
        
        List<GroupOrder> recentOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .sorted(Comparator.comparing(GroupOrder::getCreatedAt).reversed())
                .limit(10)
                .collect(Collectors.toList());
        
        long recentInitiated = recentOrders.stream()
                .filter(o -> userId.equals(o.getInitiatorUserId()))
                .count();
        
        List<Long> recentOrderIds = recentOrders.stream().map(GroupOrder::getId).collect(Collectors.toList());
        List<OrderItem> recentUserItems = getOrderItemsInOrdersAndUser(recentOrderIds, userId);
        
        Set<Long> recentParticipated = recentUserItems.stream()
                .map(OrderItem::getGroupOrderId)
                .collect(Collectors.toSet());
        
        BigDecimal recentSpent = recentUserItems.stream()
                .map(item -> item.getFinalPrice() != null ? item.getFinalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        result.put("recentInitiated", recentInitiated);
        result.put("recentParticipated", recentParticipated.size());
        result.put("recentSpent", recentSpent);
        
        return result;
    }

    private List<GroupOrder> getEndedOrdersInRange(LocalDateTime start, LocalDateTime end) {
        return groupOrderRepository.findAll().stream()
                .filter(o -> GroupOrder.OrderStatus.ENDED.equals(o.getStatus()))
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(start))
                .filter(o -> !o.getCreatedAt().isAfter(end))
                .collect(Collectors.toList());
    }

    private List<OrderItem> getOrderItemsInOrdersAndUser(List<Long> orderIds, String userId) {
        if (orderIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        return orderItemRepository.findAll().stream()
                .filter(item -> orderIds.contains(item.getGroupOrderId()))
                .filter(item -> userId.equals(item.getParticipantUserId()))
                .collect(Collectors.toList());
    }

    private String extractDepartment(String userId) {
        if (userId == null || userId.length() < 2) {
            return "未分配";
        }
        
        Map<String, String> deptMap = new LinkedHashMap<>();
        deptMap.put("TD", "技术部");
        deptMap.put("PD", "产品部");
        deptMap.put("OP", "运营部");
        deptMap.put("HR", "人事部");
        deptMap.put("FN", "财务部");
        deptMap.put("MK", "市场部");
        deptMap.put("AD", "行政部");
        
        for (Map.Entry<String, String> entry : deptMap.entrySet()) {
            if (userId.toUpperCase().startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        return "其他部门";
    }

    private static class UserStatsData {
        private final String userName;
        private int participateCount = 0;
        private int initiateCount = 0;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private BigDecimal finalAmount = BigDecimal.ZERO;
        
        public UserStatsData(String userName) {
            this.userName = userName;
        }
        
        public String getUserName() { return userName; }
        public int getParticipateCount() { return participateCount; }
        public int getInitiateCount() { return initiateCount; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getFinalAmount() { return finalAmount; }
        
        public void incrParticipateCount() { participateCount++; }
        public void incrInitiateCount() { initiateCount++; }
        public void addTotal(BigDecimal amount) { totalAmount = totalAmount.add(amount); }
        public void addFinal(BigDecimal amount) { finalAmount = finalAmount.add(amount); }
    }

    private static class DepartmentStatsData {
        private final String department;
        private int userCount = 0;
        private int participateCount = 0;
        private int initiateCount = 0;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private BigDecimal finalAmount = BigDecimal.ZERO;
        
        public DepartmentStatsData(String department) {
            this.department = department;
        }
        
        public String getDepartment() { return department; }
        public int getUserCount() { return userCount; }
        public int getParticipateCount() { return participateCount; }
        public int getInitiateCount() { return initiateCount; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getFinalAmount() { return finalAmount; }
        
        public void addUser() { userCount++; }
        public void addParticipateCount(int count) { participateCount += count; }
        public void addInitiateCount(int count) { initiateCount += count; }
        public void addTotal(BigDecimal amount) { totalAmount = totalAmount.add(amount); }
        public void addFinal(BigDecimal amount) { finalAmount = finalAmount.add(amount); }
    }
}
