package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.VenueBooking;
import com.scenic.service.VenueBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/venue-booking")
public class VenueBookingController {

    @Autowired
    private VenueBookingService bookingService;

    @GetMapping("/{id}")
    public Result<VenueBooking> getById(@PathVariable Long id) {
        return bookingService.findById(id)
                .map(Result::success)
                .orElse(Result.error("预约记录不存在"));
    }

    @GetMapping("/code/{bookingCode}")
    public Result<VenueBooking> getByBookingCode(@PathVariable String bookingCode) {
        return bookingService.findByBookingCode(bookingCode)
                .map(Result::success)
                .orElse(Result.error("预约记录不存在"));
    }

    @GetMapping("/page")
    public Result<Page<VenueBooking>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String venueId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        Long venueIdLong = null;
        if (venueId != null && !venueId.trim().isEmpty() && !"null".equalsIgnoreCase(venueId)) {
            try {
                venueIdLong = Long.valueOf(venueId);
            } catch (NumberFormatException e) {
                venueIdLong = null;
            }
        }
        return Result.success(bookingService.findByPage(keyword, status, venueIdLong, pageable));
    }

    @GetMapping("/check-conflict")
    public Result<Boolean> checkConflict(
            @RequestParam String venueId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) String excludeId) {
        Long venueIdLong;
        try {
            venueIdLong = Long.valueOf(venueId);
        } catch (NumberFormatException e) {
            return Result.error("场地ID格式错误");
        }
        
        Long excludeIdLong = null;
        if (excludeId != null && !excludeId.trim().isEmpty() && !"null".equalsIgnoreCase(excludeId)) {
            try {
                excludeIdLong = Long.valueOf(excludeId);
            } catch (NumberFormatException e) {
                excludeIdLong = null;
            }
        }
        
        boolean hasConflict = bookingService.checkTimeConflict(venueIdLong, startTime, endTime, excludeIdLong);
        return Result.success(hasConflict ? "该时间段已被预约" : "该时间段可用", hasConflict);
    }

    @PostMapping
    public Result<VenueBooking> create(@RequestBody Map<String, Object> request) {
        VenueBooking booking = new VenueBooking();
        booking.setApplicantName((String) request.get("applicantName"));
        booking.setApplicantPhone((String) request.get("applicantPhone"));
        booking.setApplicantCompany((String) request.get("applicantCompany"));
        booking.setAttendeeCount(request.get("attendeeCount") != null ? Integer.valueOf(request.get("attendeeCount").toString()) : null);
        booking.setUsagePurpose((String) request.get("usagePurpose"));
        booking.setRemark((String) request.get("remark"));

        if (request.get("startTime") != null) {
            booking.setStartTime(LocalDateTime.parse(request.get("startTime").toString()));
        }
        if (request.get("endTime") != null) {
            booking.setEndTime(LocalDateTime.parse(request.get("endTime").toString()));
        }

        Long venueId = Long.valueOf(request.get("venueId").toString());

        Map<String, Object> result = bookingService.createBooking(booking, venueId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PutMapping("/{id}")
    public Result<VenueBooking> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        VenueBooking booking = new VenueBooking();
        booking.setApplicantName((String) request.get("applicantName"));
        booking.setApplicantPhone((String) request.get("applicantPhone"));
        booking.setApplicantCompany((String) request.get("applicantCompany"));
        booking.setAttendeeCount(request.get("attendeeCount") != null ? Integer.valueOf(request.get("attendeeCount").toString()) : null);
        booking.setUsagePurpose((String) request.get("usagePurpose"));
        booking.setRemark((String) request.get("remark"));

        if (request.get("startTime") != null) {
            booking.setStartTime(LocalDateTime.parse(request.get("startTime").toString()));
        }
        if (request.get("endTime") != null) {
            booking.setEndTime(LocalDateTime.parse(request.get("endTime").toString()));
        }

        Long venueId = request.get("venueId") != null ? Long.valueOf(request.get("venueId").toString()) : null;

        Map<String, Object> result = bookingService.updateBooking(id, booking, venueId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/audit/{id}")
    public Result<VenueBooking> audit(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        String status = (String) request.get("status");
        String auditRemark = (String) request.get("auditRemark");
        Long auditorId = request.get("auditorId") != null ? Long.valueOf(request.get("auditorId").toString()) : null;

        Map<String, Object> result = bookingService.auditBooking(id, status, auditRemark, auditorId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/checkin/{id}")
    public Result<VenueBooking> checkIn(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> request) {
        Long operatorId = request != null && request.get("operatorId") != null ? Long.valueOf(request.get("operatorId").toString()) : null;
        Map<String, Object> result = bookingService.checkIn(id, operatorId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/checkout/{id}")
    public Result<VenueBooking> checkOut(@PathVariable Long id) {
        Map<String, Object> result = bookingService.checkOut(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/cancel/{id}")
    public Result<VenueBooking> cancel(@PathVariable Long id) {
        Map<String, Object> result = bookingService.cancelBooking(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (VenueBooking) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = bookingService.deleteBooking(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(bookingService.getStatistics());
    }
}
