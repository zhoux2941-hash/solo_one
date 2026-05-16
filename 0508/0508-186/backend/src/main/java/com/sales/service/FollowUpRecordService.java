package com.sales.service;

import com.sales.entity.Customer;
import com.sales.entity.FollowUpRecord;
import com.sales.repository.CustomerRepository;
import com.sales.repository.FollowUpRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FollowUpRecordService {

    @Autowired
    private FollowUpRecordRepository followUpRecordRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;

    public List<FollowUpRecord> getAllFollowUpRecords() {
        return followUpRecordRepository.findAll();
    }

    public Optional<FollowUpRecord> getFollowUpRecordById(Long id) {
        return followUpRecordRepository.findById(id);
    }

    public List<FollowUpRecord> getFollowUpRecordsByCustomerId(Long customerId) {
        return followUpRecordRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public List<FollowUpRecord> getFollowUpRecordsBySalesperson(String salesperson) {
        return followUpRecordRepository.findBySalesperson(salesperson);
    }

    @Transactional
    public FollowUpRecord createFollowUpRecord(Long customerId, FollowUpRecord record) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("客户不存在: " + customerId));

        record.setCustomer(customer);
        FollowUpRecord savedRecord = followUpRecordRepository.save(record);

        customerService.calculateDealProbability(customerId);

        return savedRecord;
    }

    @Transactional
    public FollowUpRecord updateFollowUpRecord(Long id, FollowUpRecord recordDetails) {
        return followUpRecordRepository.findById(id)
                .map(record -> {
                    record.setContent(recordDetails.getContent());
                    record.setNextContactTime(recordDetails.getNextContactTime());
                    record.setEstimatedAmount(recordDetails.getEstimatedAmount());
                    record.setSalesperson(recordDetails.getSalesperson());
                    FollowUpRecord updatedRecord = followUpRecordRepository.save(record);

                    customerService.calculateDealProbability(record.getCustomer().getId());

                    return updatedRecord;
                })
                .orElseThrow(() -> new RuntimeException("跟进记录不存在: " + id));
    }

    @Transactional
    public void deleteFollowUpRecord(Long id) {
        followUpRecordRepository.findById(id)
                .ifPresent(record -> {
                    Long customerId = record.getCustomer().getId();
                    followUpRecordRepository.deleteById(id);
                    customerService.calculateDealProbability(customerId);
                });
    }
}