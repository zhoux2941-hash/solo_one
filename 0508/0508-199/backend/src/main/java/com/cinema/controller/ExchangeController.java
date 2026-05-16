package com.cinema.controller;

import com.cinema.entity.Exchange;
import com.cinema.service.ExchangeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exchanges")
@CrossOrigin(origins = "*")
public class ExchangeController {
    
    private static final Logger logger = LoggerFactory.getLogger(ExchangeController.class);
    
    @Autowired
    private ExchangeService exchangeService;
    
    @PostMapping
    public ResponseEntity<?> exchangeSnack(@RequestBody Map<String, Long> request) {
        Long memberId = request.get("memberId");
        Long snackId = request.get("snackId");
        
        try {
            Exchange exchange = exchangeService.exchangeSnack(memberId, snackId);
            if (exchange == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "兑换失败，会员或商品不存在");
                return ResponseEntity.badRequest().body(error);
            }
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", exchange);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.error("兑换异常: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }
    
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Exchange>> getMemberExchanges(@PathVariable Long memberId) {
        return ResponseEntity.ok(exchangeService.getMemberExchanges(memberId));
    }
}