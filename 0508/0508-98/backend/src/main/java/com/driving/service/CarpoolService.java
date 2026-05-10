package com.driving.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.driving.common.BusinessException;
import com.driving.dto.BookingDTO;
import com.driving.entity.*;
import com.driving.mapper.*;
import com.driving.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CarpoolService {

    @Autowired
    private CarpoolGroupMapper carpoolGroupMapper;

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private TimeSlotMapper timeSlotMapper;

    @Autowired
    private CoachMapper coachMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Transactional
    public Long initiateCarpool(Long studentId, BookingDTO bookingDTO) {
        String lockKey = redisUtil.getLockKey(
                bookingDTO.getCoachId(),
                bookingDTO.getSlotDate().toString(),
                bookingDTO.getStartHour()
        );

        boolean locked = redisUtil.tryLock(lockKey);
        if (!locked) {
            throw new BusinessException("该时段正在被操作，请稍后重试");
        }

        try {
            Coach coach = coachMapper.selectById(bookingDTO.getCoachId());
            if (coach == null) {
                throw new BusinessException("教练不存在");
            }
            if (coach.getAcceptCarpool() == null || coach.getAcceptCarpool() == 0) {
                throw new BusinessException("该教练不接受拼车");
            }

            validateCarpoolBooking(studentId, bookingDTO);

            TimeSlot slot = timeSlotMapper.selectOne(
                    new QueryWrapper<TimeSlot>()
                            .eq("coach_id", bookingDTO.getCoachId())
                            .eq("slot_date", bookingDTO.getSlotDate())
                            .eq("start_hour", bookingDTO.getStartHour())
            );

            if (slot == null || (slot.getStatus() != 1 && slot.getStatus() != 4)) {
                throw new BusinessException("该时段不可拼车");
            }

            CarpoolGroup existingGroup = carpoolGroupMapper.selectOne(
                    new QueryWrapper<CarpoolGroup>()
                            .eq("coach_id", bookingDTO.getCoachId())
                            .eq("slot_date", bookingDTO.getSlotDate())
                            .eq("start_hour", bookingDTO.getStartHour())
                            .eq("status", 1)
            );

            if (existingGroup != null) {
                throw new BusinessException("该时段已有拼车组，可直接加入");
            }

            CarpoolGroup group = new CarpoolGroup();
            group.setCoachId(bookingDTO.getCoachId());
            group.setSlotDate(bookingDTO.getSlotDate());
            group.setStartHour(bookingDTO.getStartHour());
            group.setSlotId(slot.getId());
            group.setInitiatorId(studentId);
            group.setStatus(1);
            group.setMemberCount(1);
            carpoolGroupMapper.insert(group);

            Booking booking = new Booking();
            booking.setStudentId(studentId);
            booking.setCoachId(bookingDTO.getCoachId());
            booking.setSlotId(slot.getId());
            booking.setBookingDate(bookingDTO.getSlotDate());
            booking.setStartHour(bookingDTO.getStartHour());
            booking.setIsCarpool(1);
            booking.setCarpoolGroupId(group.getId());
            booking.setCarpoolRole("INITIATOR");
            booking.setStatus(1);
            bookingMapper.insert(booking);

            slot.setStatus(4);
            timeSlotMapper.updateById(slot);

            String slotKey = redisUtil.getSlotKey(
                    bookingDTO.getCoachId(),
                    bookingDTO.getSlotDate().toString(),
                    bookingDTO.getStartHour()
            );
            redisUtil.deleteSlotStatus(slotKey);

            return group.getId();
        } finally {
            redisUtil.unlock(lockKey);
        }
    }

    @Transactional
    public Long joinCarpool(Long studentId, Long carpoolGroupId) {
        CarpoolGroup group = carpoolGroupMapper.selectById(carpoolGroupId);
        if (group == null) {
            throw new BusinessException("拼车组不存在");
        }

        if (group.getStatus() != 1) {
            throw new BusinessException("该拼车组不可加入");
        }

        if (group.getMemberCount() >= 2) {
            throw new BusinessException("该拼车组已满员");
        }

        if (group.getInitiatorId().equals(studentId)) {
            throw new BusinessException("不能加入自己发起的拼车组");
        }

        String lockKey = "carpool:lock:" + carpoolGroupId;
        boolean locked = redisUtil.tryLock(lockKey);
        if (!locked) {
            throw new BusinessException("拼车组正在被操作，请稍后重试");
        }

        try {
            group = carpoolGroupMapper.selectById(carpoolGroupId);
            if (group.getMemberCount() >= 2) {
                throw new BusinessException("该拼车组已满员");
            }

            BookingDTO bookingDTO = new BookingDTO();
            bookingDTO.setCoachId(group.getCoachId());
            bookingDTO.setSlotDate(group.getSlotDate());
            bookingDTO.setStartHour(group.getStartHour());
            validateCarpoolBooking(studentId, bookingDTO);

            Booking booking = new Booking();
            booking.setStudentId(studentId);
            booking.setCoachId(group.getCoachId());
            booking.setSlotId(group.getSlotId());
            booking.setBookingDate(group.getSlotDate());
            booking.setStartHour(group.getStartHour());
            booking.setIsCarpool(1);
            booking.setCarpoolGroupId(group.getId());
            booking.setCarpoolRole("JOINER");
            booking.setStatus(1);
            bookingMapper.insert(booking);

            group.setMemberCount(2);
            group.setStatus(2);
            carpoolGroupMapper.updateById(group);

            TimeSlot slot = timeSlotMapper.selectById(group.getSlotId());
            if (slot != null) {
                slot.setStatus(2);
                timeSlotMapper.updateById(slot);
            }

            String slotKey = redisUtil.getSlotKey(
                    group.getCoachId(),
                    group.getSlotDate().toString(),
                    group.getStartHour()
            );
            redisUtil.deleteSlotStatus(slotKey);

            return booking.getId();
        } finally {
            redisUtil.unlock(lockKey);
        }
    }

    @Transactional
    public void cancelCarpool(Long studentId, Long bookingId) {
        Booking booking = bookingMapper.selectById(bookingId);
        if (booking == null || !booking.getStudentId().equals(studentId)) {
            throw new BusinessException("预约不存在或无权操作");
        }

        if (booking.getStatus() != 1) {
            throw new BusinessException("只能取消待上课的预约");
        }

        if (booking.getIsCarpool() == null || booking.getIsCarpool() == 0) {
            throw new BusinessException("该预约不是拼车预约");
        }

        CarpoolGroup group = carpoolGroupMapper.selectById(booking.getCarpoolGroupId());
        if (group == null) {
            throw new BusinessException("拼车组不存在");
        }

        String lockKey = "carpool:lock:" + group.getId();
        boolean locked = redisUtil.tryLock(lockKey);
        if (!locked) {
            throw new BusinessException("拼车组正在被操作，请稍后重试");
        }

        try {
            booking.setStatus(3);
            bookingMapper.updateById(booking);

            group.setMemberCount(group.getMemberCount() - 1);

            if (group.getMemberCount() <= 0) {
                group.setStatus(3);
                carpoolGroupMapper.updateById(group);

                TimeSlot slot = timeSlotMapper.selectById(group.getSlotId());
                if (slot != null) {
                    slot.setStatus(1);
                    timeSlotMapper.updateById(slot);
                }
            } else {
                group.setStatus(1);
                carpoolGroupMapper.updateById(group);

                TimeSlot slot = timeSlotMapper.selectById(group.getSlotId());
                if (slot != null) {
                    slot.setStatus(4);
                    timeSlotMapper.updateById(slot);
                }
            }

            String slotKey = redisUtil.getSlotKey(
                    group.getCoachId(),
                    group.getSlotDate().toString(),
                    group.getStartHour()
            );
            redisUtil.deleteSlotStatus(slotKey);
        } finally {
            redisUtil.unlock(lockKey);
        }
    }

    public Map<String, Object> getWaitingCarpool(Long coachId, LocalDate slotDate, Integer startHour) {
        Map<String, Object> result = carpoolGroupMapper.selectWaitingCarpool(coachId, slotDate, startHour);
        return result;
    }

    public List<Map<String, Object>> getStudentCarpools(Long studentId) {
        return carpoolGroupMapper.selectStudentCarpools(studentId);
    }

    private void validateCarpoolBooking(Long studentId, BookingDTO bookingDTO) {
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

    @Transactional
    public void setAcceptCarpool(Long coachId, boolean accept) {
        Coach coach = coachMapper.selectById(coachId);
        if (coach == null) {
            throw new BusinessException("教练不存在");
        }
        coach.setAcceptCarpool(accept ? 1 : 0);
        coachMapper.updateById(coach);
    }
}