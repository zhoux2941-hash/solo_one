package com.cinema.service;

import com.cinema.entity.Member;
import com.cinema.entity.Order;
import com.cinema.entity.Schedule;
import com.cinema.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private MemberService memberService;
    
    @Autowired
    private SeatService seatService;
    
    @Transactional
    public Order createOrder(Schedule schedule, List<Long> seatIds, String memberPhone, String seatLabels) {
        Member member = null;
        double totalPrice = schedule.getPrice() * seatIds.size();
        int earnedPoints = (int) (totalPrice * 10);
        
        if (memberPhone != null && !memberPhone.isEmpty()) {
            member = memberService.registerOrLogin(memberPhone);
            memberService.addPoints(member.getId(), earnedPoints);
        }
        
        seatService.occupySeats(seatIds);
        
        Order order = new Order();
        order.setMember(member);
        order.setSchedule(schedule);
        order.setSeats(seatLabels);
        order.setTotalPrice(totalPrice);
        order.setEarnedPoints(member != null ? earnedPoints : 0);
        
        return orderRepository.save(order);
    }
    
    public List<Order> getMemberOrders(Long memberId) {
        return orderRepository.findByMemberId(memberId);
    }
    
    public List<Object[]> getOccupancyReport() {
        List<Order> allOrders = orderRepository.findAll();
        
        return allOrders.stream()
            .collect(Collectors.groupingBy(
                o -> o.getSchedule().getMovie().getTitle(),
                Collectors.summarizingInt(Order::getEarnedPoints)
            ))
            .entrySet().stream()
            .map(e -> new Object[]{e.getKey(), e.getValue().getCount(), e.getValue().getSum()})
            .collect(Collectors.toList());
    }
}