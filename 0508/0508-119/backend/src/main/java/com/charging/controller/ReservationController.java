package com.charging.controller;

import com.charging.common.ResponseResult;
import com.charging.dto.ReservationRequest;
import com.charging.entity.Reservation;
import com.charging.service.AuthService;
import com.charging.service.ReservationService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {
    
    private final ReservationService reservationService;
    private final AuthService authService;
    
    @GetMapping("/my")
    public ResponseResult<List<Reservation>> getMyReservations(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        return ResponseResult.success(reservationService.getMyReservations(userId));
    }
    
    @GetMapping("/{id}")
    public ResponseResult<Reservation> getReservationById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        return reservationService.getReservationById(id)
                .map(r -> {
                    if (!r.getUserId().equals(userId) && !isAdmin(authHeader)) {
                        return ResponseResult.<Reservation>error(403, "无权查看");
                    }
                    return ResponseResult.success(r);
                })
                .orElse(ResponseResult.error("预约不存在"));
    }
    
    @PostMapping
    public ResponseResult<Reservation> createReservation(
            @RequestBody ReservationRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        try {
            Reservation reservation = reservationService.createReservation(userId, request);
            return ResponseResult.success(reservation);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/use")
    public ResponseResult<Reservation> useReservation(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        try {
            Reservation reservation = reservationService.useReservation(id, userId);
            return ResponseResult.success(reservation);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/complete")
    public ResponseResult<Reservation> completeReservation(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        try {
            Reservation reservation = reservationService.completeReservation(id, userId);
            return ResponseResult.success(reservation);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseResult<Reservation> cancelReservation(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        try {
            Reservation reservation = reservationService.cancelReservation(id, userId);
            return ResponseResult.success(reservation);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return null;
        }
        
        return claims.get("userId", Long.class);
    }
    
    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return false;
        }
        
        String role = claims.get("role", String.class);
        return "ADMIN".equals(role);
    }
}
