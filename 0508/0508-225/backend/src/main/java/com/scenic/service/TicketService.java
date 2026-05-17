package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.Ticket;
import com.scenic.entity.TicketType;
import com.scenic.entity.TicketVerifyRecord;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.TicketRepository;
import com.scenic.repository.TicketTypeRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketTypeRepository ticketTypeRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TicketVerifyRecordRepository verifyRecordRepository;

    public Map<String, Object> sellTicket(Long ticketTypeId, Integer quantity, 
            String buyerName, String buyerPhone, String buyerIdCard, Long sellerId) {
        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId).orElse(null);
        if (ticketType == null) {
            return Map.of("success", false, "message", "票种不存在");
        }

        if (!"启用".equals(ticketType.getStatus())) {
            return Map.of("success", false, "message", "该票种已停用");
        }

        Employee seller = sellerId != null ? employeeRepository.findById(sellerId).orElse(null) : null;

        List<Ticket> tickets = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            Ticket ticket = new Ticket();
            ticket.setTicketCode("TCK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
            ticket.setTicketType(ticketType);
            ticket.setSalePrice(ticketType.getPrice());
            ticket.setBuyerName(buyerName);
            ticket.setBuyerPhone(buyerPhone);
            ticket.setBuyerIdCard(buyerIdCard);
            ticket.setSeller(seller);
            ticket.setSaleTime(LocalDateTime.now());

            if (ticketType.getValidDays() != null && ticketType.getValidDays() > 0) {
                ticket.setExpireTime(LocalDateTime.now().plusDays(ticketType.getValidDays()));
            } else if (ticketType.getValidEndTime() != null) {
                ticket.setExpireTime(ticketType.getValidEndTime());
            }

            tickets.add(ticketRepository.save(ticket));
        }

        ticketType.setSoldCount((ticketType.getSoldCount() == null ? 0 : ticketType.getSoldCount()) + quantity);
        ticketTypeRepository.save(ticketType);

        return Map.of("success", true, "message", "售票成功", "data", tickets);
    }

    public Map<String, Object> verifyTicket(String ticketCode, Long operatorId, Long resourceId,
            String visitorName, String visitorPhone) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "message", "票据不存在");
        }

        if (!"未使用".equals(ticket.getStatus())) {
            return Map.of("success", false, "message", "该票据状态为" + ticket.getStatus() + "，无法核销");
        }

        if (ticket.getExpireTime() != null && ticket.getExpireTime().isBefore(LocalDateTime.now())) {
            ticket.setStatus("已过期");
            ticketRepository.save(ticket);
            return Map.of("success", false, "message", "票据已过期");
        }

        Employee operator = operatorId != null ? employeeRepository.findById(operatorId).orElse(null) : null;

        ticket.setStatus("已使用");
        ticket.setVerifyTime(LocalDateTime.now());
        ticketRepository.save(ticket);

        TicketVerifyRecord verifyRecord = new TicketVerifyRecord();
        verifyRecord.setTicketCode(ticketCode);
        verifyRecord.setTicket(ticket);
        verifyRecord.setTicketType(ticket.getTicketType());
        verifyRecord.setVisitorName(visitorName);
        verifyRecord.setVisitorPhone(visitorPhone);
        verifyRecord.setOperator(operator);
        verifyRecordRepository.save(verifyRecord);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "核销成功");
        result.put("data", ticket);
        if (operator != null) {
            result.put("operator", operator);
        }
        return result;
    }

    public Map<String, Object> voidExpiredTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "message", "票据不存在");
        }

        if (!"未使用".equals(ticket.getStatus())) {
            return Map.of("success", false, "message", "只能作废未使用的票据");
        }

        ticket.setStatus("已作废");
        ticketRepository.save(ticket);

        return Map.of("success", true, "message", "作废成功");
    }

    public Optional<Ticket> findById(Long id) {
        return ticketRepository.findById(id);
    }

    public Optional<Ticket> findByTicketCode(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode);
    }

    public Page<Ticket> findByPage(String keyword, String status, Long ticketTypeId, Pageable pageable) {
        return ticketRepository.findByConditions(keyword, status, ticketTypeId, pageable);
    }

    public Map<String, Object> getTodayStatistics() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        Map<String, Object> result = new HashMap<>();
        result.put("totalUnused", ticketRepository.countByStatus("未使用"));
        result.put("totalUsed", ticketRepository.countByStatus("已使用"));
        result.put("todayVerified", verifyRecordRepository.countByCreateTimeBetween(startOfDay, endOfDay));
        result.put("todayVerifiedByCategory", new ArrayList<>());

        return result;
    }

    public List<Ticket> findExpiredUnusedTickets() {
        return ticketRepository.findAll().stream()
                .filter(t -> "未使用".equals(t.getStatus()) 
                        && t.getExpireTime() != null 
                        && t.getExpireTime().isBefore(LocalDateTime.now()))
                .toList();
    }
}
