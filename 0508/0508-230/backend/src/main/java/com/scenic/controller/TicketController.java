package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Ticket;
import com.scenic.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ticket")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping("/sell")
    public Result<List<Ticket>> sellTicket(@RequestBody Map<String, Object> request) {
        Long ticketTypeId = Long.valueOf(request.get("ticketTypeId").toString());
        Integer quantity = Integer.valueOf(request.get("quantity").toString());
        String buyerName = (String) request.get("buyerName");
        String buyerPhone = (String) request.get("buyerPhone");
        String buyerIdCard = (String) request.get("buyerIdCard");
        Long sellerId = request.get("sellerId") != null ? Long.valueOf(request.get("sellerId").toString()) : null;

        Map<String, Object> result = ticketService.sellTicket(ticketTypeId, quantity, buyerName, buyerPhone, buyerIdCard, sellerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (List<Ticket>) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/verify")
    public Result<Ticket> verifyTicket(@RequestBody Map<String, Object> request) {
        String ticketCode = (String) request.get("ticketCode");
        Long operatorId = request.get("operatorId") != null ? Long.valueOf(request.get("operatorId").toString()) : null;
        Long resourceId = request.get("resourceId") != null ? Long.valueOf(request.get("resourceId").toString()) : null;
        String visitorName = (String) request.get("visitorName");
        String visitorPhone = (String) request.get("visitorPhone");

        Map<String, Object> result = ticketService.verifyTicket(ticketCode, operatorId, resourceId, visitorName, visitorPhone);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Ticket) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/void/{id}")
    public Result<Void> voidExpiredTicket(@PathVariable Long id) {
        Map<String, Object> result = ticketService.voidExpiredTicket(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<Ticket> getById(@PathVariable Long id) {
        return ticketService.findById(id)
                .map(Result::success)
                .orElse(Result.error("票据不存在"));
    }

    @GetMapping("/code/{ticketCode}")
    public Result<Ticket> getByTicketCode(@PathVariable String ticketCode) {
        return ticketService.findByTicketCode(ticketCode)
                .map(Result::success)
                .orElse(Result.error("票据不存在"));
    }

    @GetMapping("/page")
    public Result<Page<Ticket>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ticketTypeId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        Long ticketTypeIdLong = null;
        if (ticketTypeId != null && !ticketTypeId.trim().isEmpty() && !"null".equalsIgnoreCase(ticketTypeId)) {
            try {
                ticketTypeIdLong = Long.valueOf(ticketTypeId);
            } catch (NumberFormatException e) {
                ticketTypeIdLong = null;
            }
        }
        return Result.success(ticketService.findByPage(keyword, status, ticketTypeIdLong, pageable));
    }

    @GetMapping("/statistics/today")
    public Result<Map<String, Object>> getTodayStatistics() {
        return Result.success(ticketService.getTodayStatistics());
    }

    @GetMapping("/expired")
    public Result<List<Ticket>> getExpiredUnusedTickets() {
        return Result.success(ticketService.findExpiredUnusedTickets());
    }
}
