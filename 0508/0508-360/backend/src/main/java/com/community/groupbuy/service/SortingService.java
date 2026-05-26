package com.community.groupbuy.service;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.SortingItem;
import com.community.groupbuy.enums.OrderStatus;
import com.community.groupbuy.repository.OrderRepository;
import com.community.groupbuy.repository.ProductRepository;
import com.community.groupbuy.repository.SortingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SortingService {

    @Autowired
    private SortingItemRepository sortingItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderStateService orderStateService;

    @Autowired
    private PickupCodeService pickupCodeService;

    public List<SortingItem> getSortingList(Long activityId) {
        return sortingItemRepository.findByActivityId(activityId);
    }

    public List<Map<String, Object>> getSortingDetail(Long activityId) {
        List<Map<String, Object>> result = new ArrayList<>();

        List<SortingItem> items = sortingItemRepository.findByActivityId(activityId);
        for (SortingItem item : items) {
            Map<String, Object> map = new HashMap<>();
            map.put("sortingItem", item);

            Product product = productRepository.findById(item.getProductId()).orElse(null);
            map.put("product", product);

            List<Order> orders = orderRepository.findByActivityIdAndStatus(
                activityId, OrderStatus.PENDING_SORTING.getCode());
            List<Order> productOrders = new ArrayList<>();
            for (Order order : orders) {
                if (order.getProductId().equals(item.getProductId())) {
                    productOrders.add(order);
                }
            }
            map.put("orders", productOrders);

            result.add(map);
        }

        return result;
    }

    @Transactional
    public SortingItem updateSortedQuantity(Long sortingItemId, Integer quantity) {
        SortingItem item = sortingItemRepository.findById(sortingItemId)
                .orElseThrow(() -> new RuntimeException("分拣项不存在"));

        if (quantity > item.getTotalQuantity()) {
            throw new RuntimeException("分拣数量不能超过总数量");
        }

        item.setSortedQuantity(quantity);
        item.setSortingTime(LocalDateTime.now());

        if (quantity >= item.getTotalQuantity()) {
            item.setStatus("COMPLETED");

            List<Order> orders = orderRepository.findByActivityIdAndStatus(
                item.getActivityId(), OrderStatus.PENDING_SORTING.getCode());
            for (Order order : orders) {
                if (order.getProductId().equals(item.getProductId())) {
                    orderStateService.sort(order.getId());
                }
            }

            pickupCodeService.generatePickupCodesForActivity(item.getActivityId(), item.getProductId());
        } else {
            item.setStatus("IN_PROGRESS");
        }

        return sortingItemRepository.save(item);
    }

    @Transactional
    public void completeSorting(Long activityId) {
        List<SortingItem> items = sortingItemRepository.findByActivityId(activityId);
        for (SortingItem item : items) {
            if (!"COMPLETED".equals(item.getStatus())) {
                item.setStatus("COMPLETED");
                item.setSortedQuantity(item.getTotalQuantity());
                item.setSortingTime(LocalDateTime.now());
                sortingItemRepository.save(item);

                List<Order> orders = orderRepository.findByActivityIdAndStatus(
                    activityId, OrderStatus.PENDING_SORTING.getCode());
                for (Order order : orders) {
                    if (order.getProductId().equals(item.getProductId())) {
                        orderStateService.sort(order.getId());
                    }
                }

                pickupCodeService.generatePickupCodesForActivity(activityId, item.getProductId());
            }
        }
    }

    @Transactional
    public void updateSortingItem(Long activityId, Long productId) {
        Optional<SortingItem> existingOpt = sortingItemRepository.findByActivityIdAndProductId(activityId, productId);

        List<Object[]> sums = orderRepository.sumQuantityByProductIdForActivity(activityId);
        for (Object[] sum : sums) {
            Long pId = (Long) sum[0];
            Long totalQty = (Long) sum[1];

            if (pId.equals(productId)) {
                Product product = productRepository.findById(pId).orElse(null);
                SortingItem item;
                if (existingOpt.isPresent()) {
                    item = existingOpt.get();
                } else {
                    item = new SortingItem();
                    item.setActivityId(activityId);
                    item.setProductId(pId);
                    item.setProductName(product != null ? product.getName() : "");
                    item.setSortedQuantity(0);
                    item.setStatus("PENDING");
                }
                item.setTotalQuantity(totalQty.intValue());
                sortingItemRepository.save(item);
                break;
            }
        }
    }

    public void generateSortingItems(Long activityId) {
        List<Object[]> sums = orderRepository.sumQuantityByProductIdForActivity(activityId);
        for (Object[] sum : sums) {
            Long productId = (Long) sum[0];
            Long totalQty = (Long) sum[1];

            if (sortingItemRepository.findByActivityIdAndProductId(activityId, productId).isPresent()) {
                continue;
            }

            Product product = productRepository.findById(productId).orElse(null);
            SortingItem item = new SortingItem();
            item.setActivityId(activityId);
            item.setProductId(productId);
            item.setProductName(product != null ? product.getName() : "");
            item.setTotalQuantity(totalQty.intValue());
            item.setSortedQuantity(0);
            item.setStatus("PENDING");
            sortingItemRepository.save(item);
        }
    }
}
