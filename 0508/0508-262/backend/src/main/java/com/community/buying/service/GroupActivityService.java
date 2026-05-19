package com.community.buying.service;

import com.community.buying.entity.GroupActivity;
import com.community.buying.entity.GroupRecord;
import com.community.buying.entity.Order;
import com.community.buying.repository.GroupActivityRepository;
import com.community.buying.repository.GroupRecordRepository;
import com.community.buying.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GroupActivityService {

    @Autowired
    private GroupActivityRepository groupActivityRepository;

    @Autowired
    private GroupRecordRepository groupRecordRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    public GroupActivity save(GroupActivity activity) {
        return groupActivityRepository.save(activity);
    }

    public GroupActivity findById(Long id) {
        return groupActivityRepository.findById(id).orElse(null);
    }

    public List<GroupActivity> findAll() {
        return groupActivityRepository.findAll();
    }

    public List<GroupActivity> findActiveActivities() {
        return groupActivityRepository.findActiveActivities(LocalDateTime.now());
    }

    public List<GroupActivity> findByProductIdAndStatus(Long productId, Integer status) {
        return groupActivityRepository.findByProductIdAndStatus(productId, status);
    }

    public void deleteById(Long id) {
        groupActivityRepository.deleteById(id);
    }

    public GroupActivity updateStatus(Long id, Integer status) {
        GroupActivity activity = findById(id);
        if (activity != null) {
            activity.setStatus(status);
            return groupActivityRepository.save(activity);
        }
        return null;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkExpiredGroupActivities() {
        LocalDateTime now = LocalDateTime.now();
        List<GroupActivity> activeActivities = groupActivityRepository.findByStatus(1);

        for (GroupActivity activity : activeActivities) {
            if (activity.getEndTime() != null && activity.getEndTime().isBefore(now)) {
                List<GroupRecord> records = groupRecordRepository.findByGroupActivityId(activity.getId());
                long paidCount = records.stream()
                        .filter(r -> r.getOrder() != null && r.getOrder().getPayStatus() == 1)
                        .count();

                if (paidCount < activity.getMinGroupSize()) {
                    handleFailedGroup(activity, records);
                } else {
                    handleCompletedGroup(activity, records);
                }
            }
        }
    }

    @Transactional
    public void handleFailedGroup(GroupActivity activity, List<GroupRecord> records) {
        activity.setStatus(3);
        groupActivityRepository.save(activity);

        for (GroupRecord record : records) {
            record.setStatus(2);
            groupRecordRepository.save(record);

            if (record.getOrder() != null) {
                Order order = record.getOrder();
                order.setOrderStatus(5);
                orderRepository.save(order);
            }
        }
    }

    @Transactional
    public void handleCompletedGroup(GroupActivity activity, List<GroupRecord> records) {
        activity.setStatus(2);
        groupActivityRepository.save(activity);

        for (GroupRecord record : records) {
            record.setStatus(1);
            groupRecordRepository.save(record);

            if (record.getOrder() != null && record.getOrder().getPayStatus() == 1) {
                Order order = record.getOrder();
                order.setOrderStatus(1);
                orderRepository.save(order);
            }
        }
    }

    @Transactional
    public void triggerGroupCompletionCheck(Long activityId) {
        GroupActivity activity = findById(activityId);
        if (activity != null && activity.getStatus() == 1) {
            orderService.checkAndCompleteGroup(activity);
        }
    }
}