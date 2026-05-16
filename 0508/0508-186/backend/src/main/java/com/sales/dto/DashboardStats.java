package com.sales.dto;

import java.math.BigDecimal;
import java.util.Map;

public class DashboardStats {

    private BigDecimal totalEstimatedAmount;
    private Map<String, BigDecimal> estimatedAmountBySalesperson;
    private Long totalCustomers;
    private Long followUpRecordsLast30Days;

    public BigDecimal getTotalEstimatedAmount() {
        return totalEstimatedAmount;
    }

    public void setTotalEstimatedAmount(BigDecimal totalEstimatedAmount) {
        this.totalEstimatedAmount = totalEstimatedAmount;
    }

    public Map<String, BigDecimal> getEstimatedAmountBySalesperson() {
        return estimatedAmountBySalesperson;
    }

    public void setEstimatedAmountBySalesperson(Map<String, BigDecimal> estimatedAmountBySalesperson) {
        this.estimatedAmountBySalesperson = estimatedAmountBySalesperson;
    }

    public Long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(Long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public Long getFollowUpRecordsLast30Days() {
        return followUpRecordsLast30Days;
    }

    public void setFollowUpRecordsLast30Days(Long followUpRecordsLast30Days) {
        this.followUpRecordsLast30Days = followUpRecordsLast30Days;
    }
}