package com.community.groupbuy.service;

import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.repository.CommissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommissionService {

    @Autowired
    private CommissionRepository commissionRepository;

    public List<Commission> getByLeaderId(Long leaderId) {
        return commissionRepository.findByLeaderId(leaderId);
    }

    public List<Commission> getByLeaderIdAndStatus(Long leaderId, String status) {
        return commissionRepository.findByLeaderIdAndStatus(leaderId, status);
    }

    public Map<String, BigDecimal> getCommissionSummary(Long leaderId) {
        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("settled", commissionRepository.sumSettledAmountByLeaderId(leaderId));
        summary.put("pending", commissionRepository.sumPendingAmountByLeaderId(leaderId));
        summary.put("total", summary.get("settled").add(summary.get("pending")));
        return summary;
    }

    public List<Commission> getByActivityId(Long activityId) {
        return commissionRepository.findByActivityId(activityId);
    }
}
