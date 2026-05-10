package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.entity.Valuation;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.TransactionPriceService;
import com.blindbox.exchange.service.UserService;
import com.blindbox.exchange.service.ValuationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
public class PriceController {

    private final ValuationService valuationService;
    private final TransactionPriceService transactionPriceService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @PostMapping("/valuations")
    public ResponseEntity<ApiResponse<Valuation>> submitValuation(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> body) {
        Long userId = getCurrentUserId(token);
        User user = userService.getCurrentUser(userId);
        
        Long boxId = ((Number) body.get("boxId")).longValue();
        BigDecimal price = body.get("price") != null 
                ? new BigDecimal(body.get("price").toString()) 
                : null;
        String note = (String) body.get("note");
        
        Valuation valuation = valuationService.submitValuation(user, boxId, price, note);
        return ResponseEntity.ok(ApiResponse.success("估价已提交", valuation));
    }

    @GetMapping("/valuations/my/{boxId}")
    public ResponseEntity<ApiResponse<Valuation>> getMyValuation(
            @RequestHeader("Authorization") String token,
            @PathVariable Long boxId) {
        Long userId = getCurrentUserId(token);
        Optional<Valuation> valuation = valuationService.getUserValuation(userId, boxId);
        if (valuation.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(valuation.get()));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/valuations/stats/{boxId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBoxValuationStats(
            @PathVariable Long boxId) {
        Map<String, Object> stats = valuationService.getBoxValuationStats(boxId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/valuations/stats-series")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSeriesValuationStats(
            @RequestParam String seriesName,
            @RequestParam String styleName) {
        Map<String, Object> stats = valuationService.getSeriesValuationStats(seriesName, styleName);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/transactions/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactionStats(
            @RequestParam String seriesName,
            @RequestParam String styleName,
            @RequestParam(defaultValue = "3") int months) {
        Map<String, Object> stats = transactionPriceService.getTransactionStats(
                seriesName, styleName, months);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/transactions/recent")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentTransactions(
            @RequestParam String seriesName,
            @RequestParam String styleName,
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> transactions = transactionPriceService.getRecentTransactions(
                seriesName, styleName, limit);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
}
