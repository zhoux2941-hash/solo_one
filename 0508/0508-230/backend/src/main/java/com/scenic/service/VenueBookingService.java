package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.Venue;
import com.scenic.entity.VenueBooking;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.VenueBookingRepository;
import com.scenic.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class VenueBookingService {

    @Autowired
    private VenueBookingRepository bookingRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Optional<VenueBooking> findById(Long id) {
        return bookingRepository.findById(id);
    }

    public Optional<VenueBooking> findByBookingCode(String bookingCode) {
        return bookingRepository.findByBookingCode(bookingCode);
    }

    public Page<VenueBooking> findByPage(String keyword, String status, Long venueId, Pageable pageable) {
        return bookingRepository.findByConditions(keyword, status, venueId, pageable);
    }

    public boolean checkTimeConflict(Long venueId, LocalDateTime startTime, LocalDateTime endTime, Long excludeId) {
        List<VenueBooking> conflictingBookings;
        if (excludeId != null) {
            conflictingBookings = bookingRepository.findConflictingBookingsExcludeId(venueId, startTime, endTime, excludeId);
        } else {
            conflictingBookings = bookingRepository.findConflictingBookings(venueId, startTime, endTime);
        }
        return !conflictingBookings.isEmpty();
    }

    private BigDecimal calculateTotalAmount(Venue venue, LocalDateTime startTime, LocalDateTime endTime) {
        if (venue.getHourlyRate() == null && venue.getDailyRate() == null) {
            return BigDecimal.ZERO;
        }

        Duration duration = Duration.between(startTime, endTime);
        long hours = duration.toHours();
        long days = duration.toDays();

        BigDecimal amount = BigDecimal.ZERO;
        if (days > 0 && venue.getDailyRate() != null) {
            amount = amount.add(venue.getDailyRate().multiply(BigDecimal.valueOf(days)));
            hours = hours % 24;
        }
        if (hours > 0 && venue.getHourlyRate() != null) {
            amount = amount.add(venue.getHourlyRate().multiply(BigDecimal.valueOf(hours)));
        }

        return amount;
    }

    @Transactional
    public Map<String, Object> createBooking(VenueBooking booking, Long venueId) {
        Venue venue = venueRepository.findById(venueId).orElse(null);
        if (venue == null) {
            return Map.of("success", false, "message", "场地不存在");
        }

        if (!"开放".equals(venue.getStatus())) {
            return Map.of("success", false, "message", "该场地当前不开放预约");
        }

        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            return Map.of("success", false, "message", "请选择预约时间段");
        }

        if (booking.getEndTime().isBefore(booking.getStartTime())) {
            return Map.of("success", false, "message", "结束时间不能早于开始时间");
        }

        if (checkTimeConflict(venueId, booking.getStartTime(), booking.getEndTime(), null)) {
            return Map.of("success", false, "message", "该时间段已被预约，请选择其他时间");
        }

        booking.setBookingCode("BKG" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        booking.setVenue(venue);
        booking.setStatus("待审核");
        booking.setUsageStatus("未使用");
        booking.setTotalAmount(calculateTotalAmount(venue, booking.getStartTime(), booking.getEndTime()));

        VenueBooking saved = bookingRepository.save(booking);
        return Map.of("success", true, "message", "预约申请提交成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> auditBooking(Long id, String status, String auditRemark, Long auditorId) {
        VenueBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return Map.of("success", false, "message", "预约记录不存在");
        }

        if (!"待审核".equals(booking.getStatus())) {
            return Map.of("success", false, "message", "该预约已审核，无法重复审核");
        }

        if (!"已通过".equals(status) && !"已拒绝".equals(status)) {
            return Map.of("success", false, "message", "无效的审核状态");
        }

        Employee auditor = auditorId != null ? employeeRepository.findById(auditorId).orElse(null) : null;

        booking.setStatus(status);
        booking.setAuditRemark(auditRemark);
        booking.setAuditor(auditor);
        booking.setAuditTime(LocalDateTime.now());

        VenueBooking saved = bookingRepository.save(booking);
        return Map.of("success", true, "message", "审核完成", "data", saved);
    }

    @Transactional
    public Map<String, Object> checkIn(Long id, Long operatorId) {
        VenueBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return Map.of("success", false, "message", "预约记录不存在");
        }

        if (!"已通过".equals(booking.getStatus())) {
            return Map.of("success", false, "message", "该预约未通过审核，无法登记使用");
        }

        if ("已使用".equals(booking.getUsageStatus())) {
            return Map.of("success", false, "message", "该场地已登记使用");
        }

        Employee operator = operatorId != null ? employeeRepository.findById(operatorId).orElse(null) : null;

        booking.setUsageStatus("已使用");
        booking.setCheckInTime(LocalDateTime.now());
        booking.setOperator(operator);

        VenueBooking saved = bookingRepository.save(booking);
        return Map.of("success", true, "message", "登记使用成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> checkOut(Long id) {
        VenueBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return Map.of("success", false, "message", "预约记录不存在");
        }

        if (!"已使用".equals(booking.getUsageStatus())) {
            return Map.of("success", false, "message", "该场地未登记使用");
        }

        booking.setCheckOutTime(LocalDateTime.now());

        VenueBooking saved = bookingRepository.save(booking);
        return Map.of("success", true, "message", "使用结束登记成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> cancelBooking(Long id) {
        VenueBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return Map.of("success", false, "message", "预约记录不存在");
        }

        if ("已取消".equals(booking.getStatus())) {
            return Map.of("success", false, "message", "该预约已取消");
        }

        if ("已使用".equals(booking.getUsageStatus())) {
            return Map.of("success", false, "message", "该场地已使用，无法取消");
        }

        booking.setStatus("已取消");

        VenueBooking saved = bookingRepository.save(booking);
        return Map.of("success", true, "message", "取消预约成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> updateBooking(Long id, VenueBooking booking, Long venueId) {
        VenueBooking existing = bookingRepository.findById(id).orElse(null);
        if (existing == null) {
            return Map.of("success", false, "message", "预约记录不存在");
        }

        if (!"待审核".equals(existing.getStatus())) {
            return Map.of("success", false, "message", "只能编辑待审核状态的预约");
        }

        if (venueId != null && !venueId.equals(existing.getVenue().getId())) {
            Venue newVenue = venueRepository.findById(venueId).orElse(null);
            if (newVenue == null) {
                return Map.of("success", false, "message", "场地不存在");
            }
            if (!"开放".equals(newVenue.getStatus())) {
                return Map.of("success", false, "message", "该场地当前不开放预约");
            }
            existing.setVenue(newVenue);
        }

        LocalDateTime startTime = booking.getStartTime() != null ? booking.getStartTime() : existing.getStartTime();
        LocalDateTime endTime = booking.getEndTime() != null ? booking.getEndTime() : existing.getEndTime();

        if (endTime.isBefore(startTime)) {
            return Map.of("success", false, "message", "结束时间不能早于开始时间");
        }

        if (checkTimeConflict(existing.getVenue().getId(), startTime, endTime, id)) {
            return Map.of("success", false, "message", "该时间段已被预约，请选择其他时间");
        }

        existing.setApplicantName(booking.getApplicantName());
        existing.setApplicantPhone(booking.getApplicantPhone());
        existing.setApplicantCompany(booking.getApplicantCompany());
        existing.setStartTime(startTime);
        existing.setEndTime(endTime);
        existing.setAttendeeCount(booking.getAttendeeCount());
        existing.setUsagePurpose(booking.getUsagePurpose());
        existing.setRemark(booking.getRemark());
        existing.setTotalAmount(calculateTotalAmount(existing.getVenue(), startTime, endTime));

        VenueBooking saved = bookingRepository.save(existing);
        return Map.of("success", true, "message", "更新成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            return Map.of("success", false, "message", "预约记录不存在");
        }
        bookingRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", bookingRepository.count());
        result.put("pendingCount", bookingRepository.findByStatus("待审核").size());
        result.put("approvedCount", bookingRepository.findByStatus("已通过").size());
        result.put("rejectedCount", bookingRepository.findByStatus("已拒绝").size());
        result.put("cancelledCount", bookingRepository.findByStatus("已取消").size());
        return result;
    }
}
