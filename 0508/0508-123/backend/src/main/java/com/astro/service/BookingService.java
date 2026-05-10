package com.astro.service;

import com.astro.config.AppConfig;
import com.astro.dto.BookingRequest;
import com.astro.dto.BookingResponse;
import com.astro.entity.Booking;
import com.astro.entity.Telescope;
import com.astro.exception.BookingException;
import com.astro.repository.BookingRepository;
import com.astro.repository.TelescopeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TelescopeRepository telescopeRepository;
    private final BookingCacheService bookingCacheService;
    private final AstronomyService astronomyService;
    private final AppConfig appConfig;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        Telescope telescope = telescopeRepository.findById(request.getTelescopeId())
                .orElseThrow(() -> new BookingException("望远镜不存在"));

        if (!"AVAILABLE".equals(telescope.getStatus())) {
            throw new BookingException("该望远镜当前不可用");
        }

        validateTimeSlot(request.getStartTime(), request.getEndTime());

        LocalDateTime midTime = request.getStartTime().plusSeconds(
                java.time.Duration.between(request.getStartTime(), request.getEndTime()).getSeconds() / 2);

        double elevation = astronomyService.calculateElevation(
                request.getRa(), request.getDec(), midTime);

        double minElevation = telescope.getMinElevation() != null 
                ? telescope.getMinElevation() 
                : appConfig.getBooking().getHorizonElevation();

        if (elevation < minElevation) {
            throw new BookingException(
                    String.format("目标仰角过低，仰角: %.2f°，该望远镜最小仰角要求: %.1f°",
                            elevation, minElevation));
        }

        if (!bookingCacheService.checkSlotsAvailable(
                telescope.getId(), request.getStartTime(), request.getEndTime())) {
            throw new BookingException("所选时间槽已被占用");
        }

        Booking booking = new Booking();
        booking.setTelescope(telescope);
        booking.setUserId(request.getUserId());
        booking.setUserName(request.getUserName());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setRa(request.getRa());
        booking.setDec(request.getDec());
        booking.setExposureTime(request.getExposureTime());
        booking.setTargetName(request.getTargetName());
        booking.setElevation(elevation);
        booking.setStatus("CONFIRMED");

        Booking savedBooking = bookingRepository.save(booking);

        bookingCacheService.occupySlots(telescope.getId(), savedBooking);

        log.info("Booking created: {} by user {} for target {} at elevation {}",
                savedBooking.getId(), request.getUserId(), request.getTargetName(), elevation);

        return new BookingResponse(true, "预约成功", savedBooking.getId(), elevation);
    }

    @Transactional
    public void cancelBooking(Long bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("预约不存在"));

        if (!userId.equals(booking.getUserId())) {
            throw new BookingException("无权取消此预约");
        }

        if ("COMPLETED".equals(booking.getStatus()) || "FAILED".equals(booking.getStatus())) {
            throw new BookingException("已完成或失败的预约无法取消");
        }

        bookingCacheService.releaseSlots(
                booking.getTelescope().getId(),
                booking.getStartTime(),
                booking.getEndTime());

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        log.info("Booking cancelled: {}", bookingId);
    }

    public java.util.List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    public Booking getBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("预约不存在"));
    }

    private void validateTimeSlot(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new BookingException("不能预约过去的时间");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BookingException("结束时间必须晚于开始时间");
        }

        LocalDateTime maxBookingTime = LocalDateTime.now().plusDays(appConfig.getCache().getDaysAhead());
        if (startTime.isAfter(maxBookingTime)) {
            throw new BookingException(
                    String.format("只能预约未来 %d 天内的时间", appConfig.getCache().getDaysAhead()));
        }

        int startHour = appConfig.getBooking().getStartHour();
        int endHour = appConfig.getBooking().getEndHour();
        int slotMinutes = appConfig.getBooking().getSlotMinutes();

        LocalTime bookingStart = startTime.toLocalTime();
        LocalTime bookingEnd = endTime.toLocalTime();

        LocalTime allowedStart = LocalTime.of(startHour, 0);
        LocalTime allowedEnd = LocalTime.of(endHour, 0);

        if (bookingStart.isBefore(allowedStart) || bookingEnd.isAfter(allowedEnd)) {
            throw new BookingException(
                    String.format("只能预约 %02d:00 - %02d:00 之间的时间", startHour, endHour));
        }

        if (startTime.getMinute() % slotMinutes != 0 || 
            endTime.getMinute() % slotMinutes != 0) {
            throw new BookingException(
                    String.format("时间必须以 %d 分钟为单位", slotMinutes));
        }

        long durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        if (durationMinutes % slotMinutes != 0) {
            throw new BookingException(
                    String.format("预约时长必须是 %d 分钟的倍数", slotMinutes));
        }
    }
}
