package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.dto.ExchangeIntentRequest;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.ExchangeIntent;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.ExchangeIntentService;
import com.blindbox.exchange.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/intents")
@RequiredArgsConstructor
public class ExchangeIntentController {

    private final ExchangeIntentService exchangeIntentService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExchangeIntent>> createIntent(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ExchangeIntentRequest request) {
        Long userId = getCurrentUserId(token);
        User user = userService.getCurrentUser(userId);
        ExchangeIntent intent = exchangeIntentService.createIntent(user, request);
        return ResponseEntity.ok(ApiResponse.success("发布成功", intent));
    }

    @PostMapping("/{intentId}/cancel")
    public ResponseEntity<ApiResponse<ExchangeIntent>> cancelIntent(
            @RequestHeader("Authorization") String token,
            @PathVariable Long intentId) {
        Long userId = getCurrentUserId(token);
        ExchangeIntent intent = exchangeIntentService.cancelIntent(userId, intentId);
        return ResponseEntity.ok(ApiResponse.success("已取消", intent));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ExchangeIntent>>> getMyIntents(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<ExchangeIntent> intents = exchangeIntentService.getUserIntents(userId);
        return ResponseEntity.ok(ApiResponse.success(intents));
    }

    @GetMapping("/my/active")
    public ResponseEntity<ApiResponse<List<ExchangeIntent>>> getMyActiveIntents(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<ExchangeIntent> intents = exchangeIntentService.getUserActiveIntents(userId);
        return ResponseEntity.ok(ApiResponse.success(intents));
    }

    @GetMapping("/my/page")
    public ResponseEntity<ApiResponse<PageResponse<ExchangeIntent>>> getMyIntentsPaginated(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(token);
        PageResponse<ExchangeIntent> intents = exchangeIntentService.getUserIntentsPaginated(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(intents));
    }

    @GetMapping("/{intentId}")
    public ResponseEntity<ApiResponse<ExchangeIntent>> getIntentDetail(@PathVariable Long intentId) {
        ExchangeIntent intent = exchangeIntentService.getIntentById(intentId);
        return ResponseEntity.ok(ApiResponse.success(intent));
    }
}
