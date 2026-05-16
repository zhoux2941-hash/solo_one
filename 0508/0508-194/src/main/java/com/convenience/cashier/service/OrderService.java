package com.convenience.cashier.service;

import com.convenience.cashier.entity.CartItem;
import com.convenience.cashier.entity.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    @Autowired
    private MemberService memberService;

    public Order createOrder(List<CartItem> items, String memberPhone) {
        Order order = new Order();
        order.setOrderId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setItems(items);
        
        double totalAmount = items.stream().mapToDouble(CartItem::getSubtotal).sum();
        order.setTotalAmount(totalAmount);
        
        double discountAmount = 0;
        if (memberPhone != null && !memberPhone.isEmpty()) {
            discountAmount = totalAmount * 0.05;
            order.setMemberPhone(memberPhone);
            int earnedPoints = (int) Math.floor(totalAmount);
            order.setEarnedPoints(earnedPoints);
            memberService.addPoints(memberPhone, earnedPoints);
        }
        
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(totalAmount - discountAmount);
        order.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        
        return order;
    }
}
