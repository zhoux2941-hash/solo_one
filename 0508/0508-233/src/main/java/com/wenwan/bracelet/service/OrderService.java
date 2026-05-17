package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.Order;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.OrderRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    public Order findById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public List<Order> findByCustomerId(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    public List<Order> findByCraftsmanId(Long craftsmanId) {
        return orderRepository.findByCraftsmanId(craftsmanId);
    }

    public List<Order> findByCraftsmanIdAndStatus(Long craftsmanId, Order.OrderStatus status) {
        return orderRepository.findByCraftsmanIdAndStatus(craftsmanId, status);
    }

    public Order createOrder(Order order, Long customerId) {
        User customer = userRepository.findById(customerId).orElse(null);
        if (customer != null) {
            order.setCustomer(customer);
            return orderRepository.save(order);
        }
        return null;
    }

    public Order assignCraftsman(Long orderId, Long craftsmanId) {
        Order order = findById(orderId);
        User craftsman = userRepository.findById(craftsmanId).orElse(null);
        if (order != null && craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            order.setCraftsman(craftsman);
            return orderRepository.save(order);
        }
        return null;
    }

    public Order updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = findById(orderId);
        if (order != null) {
            order.setStatus(status);
            switch (status) {
                case CONFIRMED:
                    order.setConfirmedAt(LocalDateTime.now());
                    break;
                case IN_PRODUCTION:
                    order.setStartedAt(LocalDateTime.now());
                    break;
                case COMPLETED:
                    order.setCompletedAt(LocalDateTime.now());
                    break;
                case DELIVERED:
                    order.setDeliveredAt(LocalDateTime.now());
                    break;
            }
            return orderRepository.save(order);
        }
        return null;
    }

    public Order updateOrder(Long id, Order orderDetails) {
        Order order = findById(id);
        if (order != null) {
            order.setBraceletName(orderDetails.getBraceletName());
            order.setCustomRequirements(orderDetails.getCustomRequirements());
            order.setMaterialConfig(orderDetails.getMaterialConfig());
            order.setEstimatedPrice(orderDetails.getEstimatedPrice());
            order.setFinalPrice(orderDetails.getFinalPrice());
            order.setDesignImageUrl(orderDetails.getDesignImageUrl());
            order.setFinishedImageUrl(orderDetails.getFinishedImageUrl());
            order.setCustomerPhone(orderDetails.getCustomerPhone());
            order.setCustomerAddress(orderDetails.getCustomerAddress());
            order.setRemark(orderDetails.getRemark());
            return orderRepository.save(order);
        }
        return null;
    }
}