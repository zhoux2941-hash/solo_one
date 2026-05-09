package com.company.seatbooking;

import com.company.seatbooking.dto.BookingRequest;
import com.company.seatbooking.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

@SpringBootTest
public class DistributedLockTest {
    
    @Autowired
    private BookingService bookingService;
    
    @Test
    public void testConcurrentBooking() throws InterruptedException {
        int threadCount = 10;
        Long seatId = 1L;
        LocalDate date = LocalDate.now().plusDays(1);
        String timeSlot = "MORNING";
        
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        List<String> results = new ArrayList<>();
        
        for (int i = 0; i < threadCount; i++) {
            final int userId = i + 1;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    
                    BookingRequest request = new BookingRequest();
                    request.setSeatId(seatId);
                    request.setUserId((long) userId);
                    request.setDate(date);
                    request.setTimeSlot(timeSlot);
                    
                    try {
                        bookingService.createBooking(request);
                        int success = successCount.incrementAndGet();
                        results.add("用户" + userId + ": 预订成功 (第" + success + "个)");
                    } catch (RuntimeException e) {
                        int fail = failCount.incrementAndGet();
                        results.add("用户" + userId + ": 预订失败 - " + e.getMessage());
                    }
                    
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endLatch.countDown();
                }
            });
        }
        
        System.out.println("=== 开始并发预订测试 ===");
        System.out.println("工位: #" + seatId + ", 日期: " + date + ", 时段: " + timeSlot);
        System.out.println("并发线程数: " + threadCount);
        System.out.println();
        
        startLatch.countDown();
        endLatch.await();
        executor.shutdown();
        
        System.out.println("=== 预订结果 ===");
        results.forEach(System.out::println);
        System.out.println();
        System.out.println("=== 统计 ===");
        System.out.println("成功预订数: " + successCount.get());
        System.out.println("失败预订数: " + failCount.get());
        
        if (successCount.get() == 1) {
            System.out.println("✅ 测试通过: 只有1个用户成功预订，锁机制正常工作！");
        } else if (successCount.get() > 1) {
            System.out.println("❌ 测试失败: 有" + successCount.get() + "个用户成功预订，存在竞态条件！");
        } else {
            System.out.println("⚠️  无成功预订，请检查数据是否已存在");
        }
    }
}
