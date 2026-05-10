package com.dorm.bill.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dorm.bill.config.RedisLock;
import com.dorm.bill.dto.BillCreateRequest;
import com.dorm.bill.dto.BillDetailDTO;
import com.dorm.bill.dto.PaymentDetailDTO;
import com.dorm.bill.entity.Bill;
import com.dorm.bill.entity.Payment;
import com.dorm.bill.entity.User;
import com.dorm.bill.mapper.BillMapper;
import com.dorm.bill.mapper.PaymentMapper;
import com.dorm.bill.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class BillService {

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private PaymentMapper paymentMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RedisLock redisLock;

    @Transactional
    public Bill createBill(Long userId, BillCreateRequest request) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDormId() == null) {
            throw new RuntimeException("用户未关联寝室");
        }

        String lockKey = "bill:create:" + user.getDormId() + ":" + request.getBillDate();
        boolean locked = redisLock.tryLock(lockKey, 10, TimeUnit.SECONDS);
        if (!locked) {
            throw new RuntimeException("账单正在处理中，请稍候再试");
        }

        try {
            Bill existBill = billMapper.selectOne(
                    new LambdaQueryWrapper<Bill>()
                            .eq(Bill::getDormId, user.getDormId())
                            .eq(Bill::getBillDate, request.getBillDate())
            );
            if (existBill != null) {
                throw new RuntimeException("该月份账单已存在");
            }

            List<User> roommates = userMapper.selectList(
                    new LambdaQueryWrapper<User>().eq(User::getDormId, user.getDormId())
            );
            if (roommates.isEmpty()) {
                throw new RuntimeException("寝室暂无成员");
            }

            BigDecimal totalAmount = request.getElectricityAmount()
                    .add(request.getWaterAmount());
            BigDecimal perPersonAmount = totalAmount.divide(
                    new BigDecimal(roommates.size()), 2, RoundingMode.HALF_UP
            );

            Bill bill = new Bill();
            bill.setDormId(user.getDormId());
            bill.setBillDate(request.getBillDate());
            bill.setElectricityAmount(request.getElectricityAmount());
            bill.setWaterAmount(request.getWaterAmount());
            bill.setTotalAmount(totalAmount);
            bill.setPerPersonAmount(perPersonAmount);
            bill.setHeadCount(roommates.size());
            bill.setCreatedBy(userId);
            billMapper.insert(bill);

            for (User roommate : roommates) {
                Payment payment = new Payment();
                payment.setBillId(bill.getId());
                payment.setUserId(roommate.getId());
                payment.setAmount(perPersonAmount);
                payment.setStatus(0);
                paymentMapper.insert(payment);
            }

            return bill;
        } finally {
            redisLock.unlock(lockKey);
        }
    }

    public List<Bill> getDormBills(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDormId() == null) {
            return new ArrayList<>();
        }

        return billMapper.selectList(
                new LambdaQueryWrapper<Bill>()
                        .eq(Bill::getDormId, user.getDormId())
                        .orderByDesc(Bill::getBillDate)
        );
    }

    public List<Map<String, Object>> getMonthlyTrend(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDormId() == null) {
            return new ArrayList<>();
        }

        List<Bill> bills = billMapper.selectList(
                new LambdaQueryWrapper<Bill>()
                        .eq(Bill::getDormId, user.getDormId())
                        .orderByAsc(Bill::getBillDate)
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (Bill bill : bills) {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("billDate", bill.getBillDate());
            item.put("electricityAmount", bill.getElectricityAmount());
            item.put("waterAmount", bill.getWaterAmount());
            item.put("totalAmount", bill.getTotalAmount());
            item.put("perPersonAmount", bill.getPerPersonAmount());
            result.add(item);
        }

        return result;
    }

    public BillDetailDTO getBillDetail(Long userId, Long billId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        Bill bill = billMapper.selectById(billId);
        if (bill == null) {
            throw new RuntimeException("账单不存在");
        }

        List<Payment> payments = paymentMapper.selectList(
                new LambdaQueryWrapper<Payment>().eq(Payment::getBillId, billId)
        );

        List<Long> userIds = payments.stream().map(Payment::getUserId).collect(Collectors.toList());
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        int paidCount = 0;
        int unpaidCount = 0;
        List<PaymentDetailDTO> paymentDetails = new ArrayList<>();

        for (Payment payment : payments) {
            if (payment.getStatus() == 1) {
                paidCount++;
            } else {
                unpaidCount++;
            }

            PaymentDetailDTO dto = new PaymentDetailDTO();
            dto.setUserId(payment.getUserId());
            User u = userMap.get(payment.getUserId());
            dto.setNickname(u != null ? u.getNickname() : "");
            dto.setUsername(u != null ? u.getUsername() : "");
            dto.setAmount(payment.getAmount());
            dto.setStatus(payment.getStatus());
            dto.setPaidAt(payment.getPaidAt());
            paymentDetails.add(dto);
        }

        BillDetailDTO detail = new BillDetailDTO();
        detail.setId(bill.getId());
        detail.setBillDate(bill.getBillDate());
        detail.setElectricityAmount(bill.getElectricityAmount());
        detail.setWaterAmount(bill.getWaterAmount());
        detail.setTotalAmount(bill.getTotalAmount());
        detail.setPerPersonAmount(bill.getPerPersonAmount());
        detail.setHeadCount(bill.getHeadCount());
        detail.setPaidCount(paidCount);
        detail.setUnpaidCount(unpaidCount);
        detail.setPayments(paymentDetails);

        return detail;
    }

    @Transactional
    public void payBill(Long userId, Long billId) {
        Payment payment = paymentMapper.selectOne(
                new LambdaQueryWrapper<Payment>()
                        .eq(Payment::getBillId, billId)
                        .eq(Payment::getUserId, userId)
        );

        if (payment == null) {
            throw new RuntimeException("未找到该账单的缴费记录");
        }

        if (payment.getStatus() == 1) {
            throw new RuntimeException("已缴费，无需重复操作");
        }

        payment.setStatus(1);
        payment.setPaidAt(LocalDateTime.now());
        paymentMapper.updateById(payment);
    }

    public List<PaymentDetailDTO> getUnpaidList(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDormId() == null) {
            return new ArrayList<>();
        }

        List<Bill> bills = billMapper.selectList(
                new LambdaQueryWrapper<Bill>().eq(Bill::getDormId, user.getDormId())
        );
        List<Long> billIds = bills.stream().map(Bill::getId).collect(Collectors.toList());

        if (billIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Payment> unpaidPayments = paymentMapper.selectList(
                new LambdaQueryWrapper<Payment>()
                        .in(Payment::getBillId, billIds)
                        .eq(Payment::getStatus, 0)
        );

        Map<Long, Bill> billMap = bills.stream().collect(Collectors.toMap(Bill::getId, b -> b));
        List<Long> userIds = unpaidPayments.stream().map(Payment::getUserId).distinct().collect(Collectors.toList());
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<PaymentDetailDTO> result = new ArrayList<>();
        for (Payment payment : unpaidPayments) {
            PaymentDetailDTO dto = new PaymentDetailDTO();
            dto.setUserId(payment.getUserId());
            User u = userMap.get(payment.getUserId());
            dto.setNickname(u != null ? u.getNickname() : "");
            dto.setUsername(u != null ? u.getUsername() : "");
            dto.setAmount(payment.getAmount());
            dto.setStatus(payment.getStatus());
            result.add(dto);
        }

        return result;
    }

    public List<Map<String, Object>> getMyBills(Long userId) {
        List<Payment> myPayments = paymentMapper.selectList(
                new LambdaQueryWrapper<Payment>().eq(Payment::getUserId, userId)
        );

        if (myPayments.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> billIds = myPayments.stream().map(Payment::getBillId).collect(Collectors.toList());
        Map<Long, Bill> billMap = billMapper.selectBatchIds(billIds).stream()
                .collect(Collectors.toMap(Bill::getId, b -> b));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Payment payment : myPayments) {
            Bill bill = billMap.get(payment.getBillId());
            if (bill != null) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("billId", bill.getId());
                item.put("billDate", bill.getBillDate());
                item.put("electricityAmount", bill.getElectricityAmount());
                item.put("waterAmount", bill.getWaterAmount());
                item.put("totalAmount", bill.getTotalAmount());
                item.put("perPersonAmount", payment.getAmount());
                item.put("status", payment.getStatus());
                item.put("paidAt", payment.getPaidAt());
                result.add(item);
            }
        }

        result.sort((a, b) -> ((String) b.get("billDate")).compareTo((String) a.get("billDate")));
        return result;
    }
}
