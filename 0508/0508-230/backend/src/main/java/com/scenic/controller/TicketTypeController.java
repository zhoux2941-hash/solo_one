package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.TicketType;
import com.scenic.service.TicketTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ticket-type")
public class TicketTypeController {

    @Autowired
    private TicketTypeService ticketTypeService;

    @PostMapping
    public Result<TicketType> save(@RequestBody Map<String, Object> request) {
        TicketType ticketType = new TicketType();
        
        if (request.get("id") != null) {
            ticketType.setId(Long.valueOf(request.get("id").toString()));
        }
        ticketType.setTypeCode((String) request.get("typeCode"));
        ticketType.setTypeName((String) request.get("typeName"));
        ticketType.setTicketCategory((String) request.get("ticketCategory"));
        
        if (request.get("price") != null) {
            ticketType.setPrice(new java.math.BigDecimal(request.get("price").toString()));
        }
        if (request.get("originalPrice") != null) {
            ticketType.setOriginalPrice(new java.math.BigDecimal(request.get("originalPrice").toString()));
        }
        if (request.get("validDays") != null) {
            ticketType.setValidDays(Integer.valueOf(request.get("validDays").toString()));
        }
        if (request.get("validStartTime") != null) {
            ticketType.setValidStartTime(java.time.LocalDateTime.parse(request.get("validStartTime").toString()));
        }
        if (request.get("validEndTime") != null) {
            ticketType.setValidEndTime(java.time.LocalDateTime.parse(request.get("validEndTime").toString()));
        }
        if (request.get("maxPurchasePerPerson") != null) {
            ticketType.setMaxPurchasePerPerson(Integer.valueOf(request.get("maxPurchasePerPerson").toString()));
        }
        if (request.get("totalInventory") != null) {
            ticketType.setTotalInventory(Integer.valueOf(request.get("totalInventory").toString()));
        }
        ticketType.setDescription((String) request.get("description"));
        ticketType.setUseRules((String) request.get("useRules"));
        ticketType.setStatus((String) request.get("status"));

        @SuppressWarnings("unchecked")
        List<Long> resourceIds = (List<Long>) request.get("resourceIds");

        Map<String, Object> result = ticketTypeService.save(ticketType, resourceIds);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (TicketType) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = ticketTypeService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<TicketType> getById(@PathVariable Long id) {
        return ticketTypeService.findById(id)
                .map(Result::success)
                .orElse(Result.error("票种不存在"));
    }

    @GetMapping("/list")
    public Result<List<TicketType>> list() {
        return Result.success(ticketTypeService.findAll());
    }

    @GetMapping("/active")
    public Result<List<TicketType>> active() {
        return Result.success(ticketTypeService.findActive());
    }

    @GetMapping("/page")
    public Result<Page<TicketType>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String ticketCategory,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        return Result.success(ticketTypeService.findByPage(keyword, ticketCategory, status, pageable));
    }
}
