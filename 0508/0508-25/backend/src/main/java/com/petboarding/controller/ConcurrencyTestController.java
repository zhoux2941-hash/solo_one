package com.petboarding.controller;

import com.petboarding.entity.Booking;
import com.petboarding.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/test/concurrency")
@RequiredArgsConstructor
@Slf4j
public class ConcurrencyTestController {
    
    private final BookingService bookingService;
    
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateConcurrentBookings(
            @RequestParam Long petId1,
            @RequestParam Long petId2,
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Starting concurrent booking simulation: roomId={}, dates={}-{}", roomId, startDate, endDate);
        
        ExecutorService executor = Executors.newFixedThreadPool(2);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        List<String> results = new ArrayList<>();
        
        Callable<String> task1 = () -> {
            try {
                Booking booking = bookingService.createBooking(
                        petId1, roomId, startDate, endDate, "Concurrency Test - Pet 1");
                successCount.incrementAndGet();
                return "Pet1 SUCCESS: bookingId=" + booking.getBookingId();
            } catch (Exception e) {
                failCount.incrementAndGet();
                return "Pet1 FAILED: " + e.getMessage();
            }
        };
        
        Callable<String> task2 = () -> {
            try {
                Booking booking = bookingService.createBooking(
                        petId2, roomId, startDate, endDate, "Concurrency Test - Pet 2");
                successCount.incrementAndGet();
                return "Pet2 SUCCESS: bookingId=" + booking.getBookingId();
            } catch (Exception e) {
                failCount.incrementAndGet();
                return "Pet2 FAILED: " + e.getMessage();
            }
        };
        
        try {
            List<Future<String>> futures = executor.invokeAll(List.of(task1, task2));
            
            for (Future<String> future : futures) {
                results.add(future.get());
            }
            
        } catch (Exception e) {
            log.error("Concurrency test error", e);
            results.add("ERROR: " + e.getMessage());
        } finally {
            executor.shutdown();
        }
        
        boolean isSafe = successCount.get() == 1 && failCount.get() == 1;
        
        Map<String, Object> response = Map.of(
                "successCount", successCount.get(),
                "failCount", failCount.get(),
                "isConcurrencySafe", isSafe,
                "results", results,
                "message", isSafe 
                    ? "并发控制正常：只有一个预约成功，另一个正确拒绝" 
                    : "并发警告：可能存在超卖！成功数=" + successCount.get()
        );
        
        log.info("Concurrency test result: {}", response);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/simulate-multi")
    public ResponseEntity<Map<String, Object>> simulateMultipleConcurrentBookings(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "5") int concurrentCount) {
        
        log.info("Starting multi-concurrent booking simulation: roomId={}, count={}", roomId, concurrentCount);
        
        ExecutorService executor = Executors.newFixedThreadPool(concurrentCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        List<Map<String, Object>> results = new CopyOnWriteArrayList<>();
        
        List<Callable<Void>> tasks = new ArrayList<>();
        
        for (int i = 1; i <= concurrentCount; i++) {
            final int petId = i;
            tasks.add(() -> {
                long startTime = System.currentTimeMillis();
                String status;
                String message;
                
                try {
                    Booking booking = bookingService.createBooking(
                            1L, 
                            roomId, 
                            startDate, 
                            endDate, 
                            "Multi-Concurrent Test - Thread " + petId);
                    successCount.incrementAndGet();
                    status = "SUCCESS";
                    message = "bookingId=" + booking.getBookingId();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                    status = "FAILED";
                    message = e.getMessage();
                }
                
                long duration = System.currentTimeMillis() - startTime;
                
                results.add(Map.of(
                        "thread", petId,
                        "status", status,
                        "message", message,
                        "durationMs", duration
                ));
                
                return null;
            });
        }
        
        try {
            executor.invokeAll(tasks);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
        }
        
        boolean isSafe = successCount.get() <= 1;
        
        Map<String, Object> response = Map.of(
                "totalAttempts", concurrentCount,
                "successCount", successCount.get(),
                "failCount", failCount.get(),
                "isConcurrencySafe", isSafe,
                "message", isSafe 
                    ? "并发控制正常：最多一个预约成功" 
                    : "并发警告：存在超卖风险！成功数=" + successCount.get(),
                "details", results
        );
        
        log.info("Multi-concurrency test result: success={}, fail={}", successCount.get(), failCount.get());
        
        return ResponseEntity.ok(response);
    }
}
