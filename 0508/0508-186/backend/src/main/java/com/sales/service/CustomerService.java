package com.sales.service;

import com.sales.entity.Customer;
import com.sales.entity.FollowUpRecord;
import com.sales.repository.CustomerRepository;
import com.sales.repository.FollowUpRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private FollowUpRecordRepository followUpRecordRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public List<Customer> getCustomersBySalesperson(String salesperson) {
        return customerRepository.findBySalesperson(salesperson);
    }

    public List<String> getAllSalespersons() {
        return customerRepository.findAllSalespersons();
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Long id, Customer customerDetails) {
        return customerRepository.findById(id)
                .map(customer -> {
                    customer.setCompanyName(customerDetails.getCompanyName());
                    customer.setContactPerson(customerDetails.getContactPerson());
                    customer.setPhone(customerDetails.getPhone());
                    customer.setLevel(customerDetails.getLevel());
                    customer.setSalesperson(customerDetails.getSalesperson());
                    return customerRepository.save(customer);
                })
                .orElseThrow(() -> new RuntimeException("客户不存在: " + id));
    }

    @Transactional
    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }

    @Transactional
    public void calculateDealProbability(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("客户不存在: " + customerId));

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<FollowUpRecord> records = followUpRecordRepository
                .findByCustomerIdAndCreatedAtAfter(customerId, thirtyDaysAgo);

        int followUpCount = records.size();

        BigDecimal amountTrend = calculateAmountTrend(records);

        int probability = calculateProbability(followUpCount, amountTrend, customer.getLevel());

        customer.setDealProbability(probability);
        customerRepository.save(customer);
    }

    private BigDecimal calculateAmountTrend(List<FollowUpRecord> records) {
        if (records.size() < 2) {
            return BigDecimal.ZERO;
        }
        records.sort((r1, r2) -> r1.getCreatedAt().compareTo(r2.getCreatedAt()));
        BigDecimal firstAmount = records.get(0).getEstimatedAmount() != null ?
                records.get(0).getEstimatedAmount() : BigDecimal.ZERO;
        BigDecimal lastAmount = records.get(records.size() - 1).getEstimatedAmount() != null ?
                records.get(records.size() - 1).getEstimatedAmount() : BigDecimal.ZERO;
        return lastAmount.subtract(firstAmount);
    }

    private int calculateProbability(int followUpCount, BigDecimal amountTrend, Customer.CustomerLevel level) {
        int baseScore = 0;

        if (followUpCount >= 5) baseScore += 40;
        else if (followUpCount >= 3) baseScore += 30;
        else if (followUpCount >= 1) baseScore += 15;

        if (amountTrend.compareTo(BigDecimal.ZERO) > 0) baseScore += 25;
        else if (amountTrend.compareTo(BigDecimal.ZERO) == 0) baseScore += 10;

        if (level == Customer.CustomerLevel.A) baseScore += 35;
        else if (level == Customer.CustomerLevel.B) baseScore += 20;
        else if (level == Customer.CustomerLevel.C) baseScore += 5;

        return Math.min(100, baseScore);
    }

    public void recalculateAllProbabilities() {
        List<Customer> customers = customerRepository.findAll();
        for (Customer customer : customers) {
            calculateDealProbability(customer.getId());
        }
    }
}