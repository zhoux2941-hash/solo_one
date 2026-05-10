package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.AcceptExchangeRequest;
import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.dto.ExchangeRequestDTO;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.ExchangeRequest;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.ExchangeRequestService;
import com.blindbox.exchange.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ExchangeRequestController {

    private final ExchangeRequestService exchangeRequestService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExchangeRequest>> createRequest(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ExchangeRequestDTO request) {
        Long userId = getCurrentUserId(token);
        User user = userService.getCurrentUser(userId);
        ExchangeRequest exchangeRequest = exchangeRequestService.createRequest(user, request);
        return ResponseEntity.ok(ApiResponse.success("请求已发送", exchangeRequest));
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<ApiResponse<ExchangeRequest>> acceptRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long requestId) {
        Long userId = getCurrentUserId(token);
        ExchangeRequest request = exchangeRequestService.acceptRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("已接受交换", request));
    }
    
    @PostMapping("/{requestId}/accept-with-price")
    public ResponseEntity<ApiResponse<ExchangeRequest>> acceptRequestWithPrice(
            @RequestHeader("Authorization") String token,
            @PathVariable Long requestId,
            @RequestBody AcceptExchangeRequest acceptRequest) {
        Long userId = getCurrentUserId(token);
        ExchangeRequest request = exchangeRequestService.acceptRequestWithPrice(
                userId, requestId, 
                acceptRequest.getMyBoxPrice(), 
                acceptRequest.getOtherBoxPrice());
        return ResponseEntity.ok(ApiResponse.success("已接受交换并记录价格", request));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<ApiResponse<ExchangeRequest>> rejectRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long requestId) {
        Long userId = getCurrentUserId(token);
        ExchangeRequest request = exchangeRequestService.rejectRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("已拒绝交换", request));
    }

    @PostMapping("/{requestId}/cancel")
    public ResponseEntity<ApiResponse<ExchangeRequest>> cancelRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long requestId) {
        Long userId = getCurrentUserId(token);
        ExchangeRequest request = exchangeRequestService.cancelRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("已取消请求", request));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ExchangeRequest>>> getMyRequests(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<ExchangeRequest> requests = exchangeRequestService.getUserRequests(userId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/my/page")
    public ResponseEntity<ApiResponse<PageResponse<ExchangeRequest>>> getMyRequestsPaginated(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(token);
        PageResponse<ExchangeRequest> requests = exchangeRequestService.getUserRequestsPaginated(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ExchangeRequest>>> getPendingRequests(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<ExchangeRequest> requests = exchangeRequestService.getPendingRequests(userId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<ExchangeRequest>> getRequestDetail(@PathVariable Long requestId) {
        ExchangeRequest request = exchangeRequestService.getRequestById(requestId);
        return ResponseEntity.ok(ApiResponse.success(request));
    }
}
