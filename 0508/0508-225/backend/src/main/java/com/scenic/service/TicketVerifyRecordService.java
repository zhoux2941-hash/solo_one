package com.scenic.service;

import com.scenic.entity.BusinessResource;
import com.scenic.entity.Employee;
import com.scenic.entity.Ticket;
import com.scenic.entity.TicketVerifyRecord;
import com.scenic.repository.BusinessResourceRepository;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.TicketRepository;
import com.scenic.repository.TicketVerifyRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TicketVerifyRecordService {

    @Autowired
    private TicketVerifyRecordRepository verifyRecordRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private BusinessResourceRepository resourceRepository;

    public Map<String, Object> createVerifyRecord(String ticketCode, Long operatorId, Long resourceId,
            String visitorName, String visitorPhone) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "message", "票据不存在");
        }

        Employee operator = operatorId != null ? employeeRepository.findById(operatorId).orElse(null) : null;
        BusinessResource resource = resourceId != null ? resourceRepository.findById(resourceId).orElse(null) : null;

        TicketVerifyRecord record = new TicketVerifyRecord();
        record.setTicketCode(ticketCode);
        record.setTicket(ticket);
        record.setTicketType(ticket.getTicketType());
        record.setResource(resource);
        record.setVisitorName(visitorName);
        record.setVisitorPhone(visitorPhone);
        record.setOperator(operator);

        TicketVerifyRecord savedRecord = verifyRecordRepository.save(record);

        return Map.of("success", true, "message", "核销记录创建成功", "data", savedRecord);
    }

    public Page<TicketVerifyRecord> findByPage(String keyword, Long ticketTypeId, Pageable pageable) {
        return verifyRecordRepository.findByConditions(keyword, ticketTypeId, pageable);
    }

    public List<TicketVerifyRecord> findTodayRecords() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return verifyRecordRepository.findByCreateTimeBetween(startOfDay, endOfDay);
    }

    public Map<String, Object> getTodayStatistics() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        Map<String, Object> result = new HashMap<>();
        long todayTotal = verifyRecordRepository.countByCreateTimeBetween(startOfDay, endOfDay);
        result.put("todayTotal", todayTotal);

        List<Object[]> categoryStats = verifyRecordRepository.countByCreateTimeBetweenGroupByCategory(startOfDay, endOfDay);
        List<Map<String, Object>> categoryList = new ArrayList<>();
        for (Object[] obj : categoryStats) {
            Map<String, Object> item = new HashMap<>();
            item.put("category", obj[0]);
            item.put("count", obj[1]);
            categoryList.add(item);
        }
        result.put("byCategory", categoryList);

        return result;
    }

    public List<TicketVerifyRecord> findByTicketCode(String ticketCode) {
        return verifyRecordRepository.findByTicketCode(ticketCode);
    }
}
