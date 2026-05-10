package com.volunteer.service.impl;

import com.volunteer.entity.ExchangeOrder;
import com.volunteer.entity.Goods;
import com.volunteer.entity.TimeCoinRecord;
import com.volunteer.entity.User;
import com.volunteer.repository.ExchangeOrderRepository;
import com.volunteer.repository.GoodsRepository;
import com.volunteer.repository.TimeCoinRecordRepository;
import com.volunteer.repository.UserRepository;
import com.volunteer.service.ExchangeOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ExchangeOrderServiceImpl implements ExchangeOrderService {

    @Autowired
    private ExchangeOrderRepository exchangeOrderRepository;

    @Autowired
    private GoodsRepository goodsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeCoinRecordRepository timeCoinRecordRepository;

    @Autowired
    private GoodsServiceImpl goodsService;

    private final AtomicLong orderCounter = new AtomicLong(0);

    @Override
    @Transactional
    public ExchangeOrder create(Long userId, Long goodsId, Integer quantity) {
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new RuntimeException("物品不存在"));
        
        if (!"ON_SHELF".equals(goods.getStatus())) {
            throw new RuntimeException("该物品已下架");
        }
        
        if (goods.getStock() < quantity) {
            throw new RuntimeException("库存不足");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        int totalCoins = goods.getCoinsRequired() * quantity;
        if (user.getTimeCoins() < totalCoins) {
            throw new RuntimeException("时间币不足");
        }
        
        boolean stockReduced = goodsService.decreaseStock(goodsId, quantity);
        if (!stockReduced) {
            throw new RuntimeException("库存扣减失败");
        }
        
        int oldBalance = user.getTimeCoins();
        int newBalance = oldBalance - totalCoins;
        user.setTimeCoins(newBalance);
        userRepository.save(user);
        
        ExchangeOrder order = new ExchangeOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setGoodsId(goodsId);
        order.setGoodsName(goods.getName());
        order.setQuantity(quantity);
        order.setTotalCoins(totalCoins);
        order.setStatus("PENDING");
        ExchangeOrder savedOrder = exchangeOrderRepository.save(order);
        
        TimeCoinRecord record = new TimeCoinRecord();
        record.setUserId(userId);
        record.setType("SPEND");
        record.setAmount(totalCoins);
        record.setBalance(newBalance);
        record.setSourceType("EXCHANGE");
        record.setSourceId(savedOrder.getId());
        record.setRemark("兑换物品: " + goods.getName());
        timeCoinRecordRepository.save(record);
        
        return savedOrder;
    }

    @Override
    public List<ExchangeOrder> findByUserId(Long userId) {
        return exchangeOrderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Override
    public List<ExchangeOrder> findByStatus(String status) {
        return exchangeOrderRepository.findByStatusOrderByCreateTimeDesc(status);
    }

    @Override
    public List<ExchangeOrder> findPending() {
        return exchangeOrderRepository.findByStatusOrderByCreateTimeDesc("PENDING");
    }

    @Override
    @Transactional
    public ExchangeOrder deliver(Long orderId, Long adminId) {
        ExchangeOrder order = exchangeOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("订单状态不允许发放");
        }
        
        order.setStatus("DELIVERED");
        order.setDeliveredBy(adminId);
        order.setDeliveredTime(LocalDateTime.now());
        return exchangeOrderRepository.save(order);
    }

    @Override
    @Transactional
    public ExchangeOrder complete(Long orderId, Long adminId) {
        ExchangeOrder order = exchangeOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (!"DELIVERED".equals(order.getStatus())) {
            throw new RuntimeException("订单状态不允许核销");
        }
        
        order.setStatus("COMPLETED");
        order.setCompletedBy(adminId);
        order.setCompletedTime(LocalDateTime.now());
        return exchangeOrderRepository.save(order);
    }

    @Override
    @Transactional
    public ExchangeOrder cancel(Long orderId) {
        ExchangeOrder order = exchangeOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("订单状态不允许取消");
        }
        
        order.setStatus("CANCELLED");
        
        goodsService.increaseStock(order.getGoodsId(), order.getQuantity());
        
        User user = userRepository.findById(order.getUserId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        int oldBalance = user.getTimeCoins();
        int newBalance = oldBalance + order.getTotalCoins();
        user.setTimeCoins(newBalance);
        userRepository.save(user);
        
        TimeCoinRecord record = new TimeCoinRecord();
        record.setUserId(order.getUserId());
        record.setType("EARN");
        record.setAmount(order.getTotalCoins());
        record.setBalance(newBalance);
        record.setSourceType("EXCHANGE");
        record.setSourceId(order.getId());
        record.setRemark("订单取消退还: " + order.getGoodsName());
        timeCoinRecordRepository.save(record);
        
        return exchangeOrderRepository.save(order);
    }

    private String generateOrderNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        long counter = orderCounter.incrementAndGet();
        return "ORD" + dateStr + String.format("%04d", counter % 10000);
    }
}
