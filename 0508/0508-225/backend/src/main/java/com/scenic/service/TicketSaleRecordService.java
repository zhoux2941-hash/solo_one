package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.TicketSaleRecord;
import com.scenic.entity.TicketType;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.TicketSaleRecordRepository;
import com.scenic.repository.TicketTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class TicketSaleRecordService {

    @Autowired
    private TicketSaleRecordRepository saleRecordRepository;

    @Autowired
    private TicketTypeRepository ticketTypeRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Map<String, Object> createSaleRecord(Long ticketTypeId, Integer quantity,
            String buyerName, String buyerPhone, String buyerIdCard, Long sellerId) {
        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId).orElse(null);
        if (ticketType == null) {
            return Map.of("success", false, "message", "票种不存在");
        }

        Employee seller = sellerId != null ? employeeRepository.findById(sellerId).orElse(null) : null;

        TicketSaleRecord record = new TicketSaleRecord();
        record.setOrderNo("ORD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        record.setTicketType(ticketType);
        record.setQuantity(quantity);
        record.setUnitPrice(ticketType.getPrice());
        record.setTotalAmount(ticketType.getPrice().multiply(new BigDecimal(quantity)));
        record.setBuyerName(buyerName);
        record.setBuyerPhone(buyerPhone);
        record.setBuyerIdCard(buyerIdCard);
        record.setSeller(seller);

        TicketSaleRecord savedRecord = saleRecordRepository.save(record);

        return Map.of("success", true, "message", "销售记录创建成功", "data", savedRecord);
    }

    public Optional<TicketSaleRecord> findById(Long id) {
        return saleRecordRepository.findById(id);
    }

    public Page<TicketSaleRecord> findByPage(String keyword, Long ticketTypeId, Pageable pageable) {
        return saleRecordRepository.findByConditions(keyword, ticketTypeId, pageable);
    }

    public List<TicketSaleRecord> findTodayRecords() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return saleRecordRepository.findByCreateTimeBetween(startOfDay, endOfDay);
    }
}
