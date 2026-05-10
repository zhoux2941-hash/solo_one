package com.driving.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.driving.common.BusinessException;
import com.driving.dto.BookingDTO;
import com.driving.entity.Booking;
import com.driving.entity.TimeSlot;
import com.driving.mapper.BookingMapper;
import com.driving.mapper.TimeSlotMapper;
import com.driving.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class BookingService {

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private TimeSlotMapper timeSlotMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Transactional
    public Long bookSlot(Long studentId, BookingDTO bookingDTO) {
        String lockKey = redisUtil.getLockKey(
                bookingDTO.getCoachId(),
                bookingDTO.getSlotDate().toString(),
                bookingDTO.getStartHour()
        );

        boolean locked = redisUtil.tryLock(lockKey);
        if (!locked) {
            throw new BusinessException("该时段正在被预约，请稍后重试");
        }

        try {
            validateBooking(studentId, bookingDTO);

            TimeSlot slot = timeSlotMapper.selectOne(
                    new QueryWrapper<TimeSlot>()
                            .eq("coach_id", bookingDTO.getCoachId())
                            .eq("slot_date", bookingDTO.getSlotDate())
                            .eq("start_hour", bookingDTO.getStartHour())
            );

            if (slot == null || slot.getStatus() != 1) {
                throw new BusinessException("该时段不可预约");
            }

            Booking booking = new Booking();
            booking.setStudentId(studentId);
            booking.setCoachId(bookingDTO.getCoachId());
            booking.setSlotId(slot.getId());
            booking.setBookingDate(bookingDTO.getSlotDate());
            booking.setStartHour(bookingDTO.getStartHour());
            booking.setIsCarpool(0);
            booking.setStatus(1);
            bookingMapper.insert(booking);

            slot.setStatus(2);
            timeSlotMapper.updateById(slot);

            String slotKey = redisUtil.getSlotKey(
                    bookingDTO.getCoachId(),
                    bookingDTO.getSlotDate().toString(),
                    bookingDTO.getStartHour()
            );
            redisUtil.setSlotStatusWithExpire(slotKey, 2, 7 * 24 * 60 * 60);

            return booking.getId();
        } finally {
            redisUtil.unlock(lockKey);
        }
    }

    @Transactional
    public void cancelBooking(Long studentId, Long bookingId) {
        Booking booking = bookingMapper.selectById(bookingId);
        if (booking == null || !booking.getStudentId().equals(studentId)) {
            throw new BusinessException("预约不存在或无权操作");
        }

        if (booking.getStatus() != 1) {
            throw new BusinessException("只能取消待上课的预约");
        }

        if (booking.getIsCarpool() != null && booking.getIsCarpool() == 1) {
            throw new BusinessException("拼车预约请使用拼车取消接口");
        }

        booking.setStatus(3);
        bookingMapper.updateById(booking);

        TimeSlot slot = timeSlotMapper.selectById(booking.getSlotId());
        if (slot != null) {
            slot.setStatus(1);
            timeSlotMapper.updateById(slot);

            String slotKey = redisUtil.getSlotKey(
                    booking.getCoachId(),
                    booking.getBookingDate().toString(),
                    booking.getStartHour()
            );
            redisUtil.deleteSlotStatus(slotKey);
        }
    }

    @Transactional
    public void completeBooking(Long bookingId) {
        Booking booking = bookingMapper.selectById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约不存在");
        }

        if (booking.getStatus() != 1) {
            throw new BusinessException("预约状态不正确");
        }

        booking.setStatus(2);
        bookingMapper.updateById(booking);
    }

    public List<Map<String, Object>> getStudentBookings(Long studentId) {
        return bookingMapper.selectStudentBookings(studentId);
    }

    public List<Map<String, Object>> getCoachBookings(Long coachId) {
        return bookingMapper.selectCoachBookings(coachId);
    }

    public Map<String, Object> getBookingDetail(Long bookingId) {
        return bookingMapper.selectBookingWithRating(bookingId);
    }

    private void validateBooking(Long studentId, BookingDTO bookingDTO) {
        if (bookingDTO.getSlotDate().isBefore(LocalDate.now()) ||
                bookingDTO.getSlotDate().isEqual(LocalDate.now())) {
            throw new BusinessException("只能预约未来的时段");
        }

        if (bookingDTO.getSlotDate().isAfter(LocalDate.now().plusDays(7))) {
            throw new BusinessException("最多只能预约未来7天的时段");
        }

        Integer dailyCount = bookingMapper.countStudentDailyBookings(studentId, bookingDTO.getSlotDate());
        if (dailyCount >= 1) {
            throw new BusinessException("每人每天最多预约1小时");
        }
    }
}