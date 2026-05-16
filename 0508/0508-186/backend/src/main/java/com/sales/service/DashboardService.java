package com.sales.service;

import com.sales.dto.DashboardStats;
import com.sales.entity.Customer;
import com.sales.entity.FollowUpRecord;
import com.sales.repository.CustomerRepository;
import com.sales.repository.FollowUpRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private FollowUpRecordRepository followUpRecordRepository;

    @Autowired
    private CustomerService customerService;

    public DashboardStats getDashboardStats() {
        customerService.recalculateAllProbabilities();

        DashboardStats stats = new DashboardStats();

        List<Customer> customers = customerRepository.findAll();
        stats.setTotalCustomers((long) customers.size());

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<FollowUpRecord> recentRecords = followUpRecordRepository.findAllByCreatedAtAfter(thirtyDaysAgo);
        stats.setFollowUpRecordsLast30Days((long) recentRecords.size());

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<String, BigDecimal> salespersonAmounts = new HashMap<>();

        for (Customer customer : customers) {
            List<FollowUpRecord> records = followUpRecordRepository
                    .findByCustomerIdOrderByCreatedAtDesc(customer.getId());

            if (!records.isEmpty()) {
                FollowUpRecord latestRecord = records.get(0);
                if (latestRecord.getEstimatedAmount() != null) {
                    BigDecimal probability = BigDecimal.valueOf(customer.getDealProbability())
                            .divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                    BigDecimal expectedAmount = latestRecord.getEstimatedAmount().multiply(probability);

                    totalAmount = totalAmount.add(expectedAmount);

                    String salesperson = customer.getSalesperson() != null ?
                            customer.getSalesperson() : "未分配";
                    salespersonAmounts.merge(salesperson, expectedAmount, BigDecimal::add);
                }
            }
        }

        stats.setTotalEstimatedAmount(totalAmount);
        stats.setEstimatedAmountBySalesperson(salespersonAmounts);

        return stats;
    }

    public List<Customer> getAllCustomersWithProbability() {
        customerService.recalculateAllProbabilities();
        return customerRepository.findAll();
    }
}