package com.driving.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.driving.common.BusinessException;
import com.driving.dto.TimeSlotDTO;
import com.driving.entity.Coach;
import com.driving.entity.TimeSlot;
import com.driving.mapper.CoachMapper;
import com.driving.mapper.TimeSlotMapper;
import com.driving.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class CoachService {

    @Autowired
    private CoachMapper coachMapper;

    @Autowired
    private TimeSlotMapper timeSlotMapper;

    @Autowired
    private RedisUtil redisUtil;

    public List<Map<String, Object>> getCoachList() {
        return coachMapper.selectCoachList();
    }

    public Map<String, Object> getCoachDetail(Long coachId) {
        return coachMapper.selectCoachWithName(coachId);
    }

    public Coach getCoachByUserId(Long userId) {
        return coachMapper.selectOne(
                new QueryWrapper<Coach>().eq("user_id", userId)
        );
    }

    @Transactional
    public void setAvailableSlot(Long coachId, TimeSlotDTO slotDTO) {
        validateSlotDate(slotDTO.getSlotDate());
        validateHour(slotDTO.getStartHour());

        TimeSlot slot = getOrCreateSlot(coachId, slotDTO.getSlotDate(), slotDTO.getStartHour());

        if (slot.getStatus() == 3) {
            throw new BusinessException("该时段已锁定，无法设置为可预约");
        }

        slot.setStatus(1);
        timeSlotMapper.updateById(slot);

        String slotKey = redisUtil.getSlotKey(coachId, slotDTO.getSlotDate().toString(), slotDTO.getStartHour());
        redisUtil.deleteSlotStatus(slotKey);
    }

    @Transactional
    public void lockSlot(Long coachId, TimeSlotDTO slotDTO) {
        validateSlotDate(slotDTO.getSlotDate());
        validateHour(slotDTO.getStartHour());

        TimeSlot slot = getOrCreateSlot(coachId, slotDTO.getSlotDate(), slotDTO.getStartHour());

        if (slot.getStatus() == 2) {
            throw new BusinessException("该时段已被预约，无法锁定");
        }

        slot.setStatus(3);
        timeSlotMapper.updateById(slot);

        String slotKey = redisUtil.getSlotKey(coachId, slotDTO.getSlotDate().toString(), slotDTO.getStartHour());
        redisUtil.deleteSlotStatus(slotKey);
    }

    @Transactional
    public void unlockSlot(Long coachId, TimeSlotDTO slotDTO) {
        validateSlotDate(slotDTO.getSlotDate());
        validateHour(slotDTO.getStartHour());

        TimeSlot slot = getOrCreateSlot(coachId, slotDTO.getSlotDate(), slotDTO.getStartHour());

        slot.setStatus(0);
        timeSlotMapper.updateById(slot);

        String slotKey = redisUtil.getSlotKey(coachId, slotDTO.getSlotDate().toString(), slotDTO.getStartHour());
        redisUtil.deleteSlotStatus(slotKey);
    }

    private TimeSlot getOrCreateSlot(Long coachId, LocalDate slotDate, Integer startHour) {
        TimeSlot slot = timeSlotMapper.selectOne(
                new QueryWrapper<TimeSlot>()
                        .eq("coach_id", coachId)
                        .eq("slot_date", slotDate)
                        .eq("start_hour", startHour)
        );

        if (slot == null) {
            slot = new TimeSlot();
            slot.setCoachId(coachId);
            slot.setSlotDate(slotDate);
            slot.setStartHour(startHour);
            slot.setStatus(0);
            timeSlotMapper.insert(slot);
        }

        return slot;
    }

    public List<Map<String, Object>> getCoachSlots(Long coachId, LocalDate date) {
        LocalDate startDate = date;
        LocalDate endDate = date.plusDays(7);

        List<TimeSlot> slots = timeSlotMapper.selectList(
                new QueryWrapper<TimeSlot>()
                        .eq("coach_id", coachId)
                        .ge("slot_date", startDate)
                        .lt("slot_date", endDate)
        );

        Map<String, TimeSlot> slotMap = new HashMap<>();
        for (TimeSlot slot : slots) {
            String key = slot.getSlotDate().toString() + "_" + slot.getStartHour();
            slotMap.put(key, slot);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate currentDate = date.plusDays(i);
            for (int hour = 8; hour < 20; hour++) {
                String key = currentDate.toString() + "_" + hour;
                TimeSlot slot = slotMap.get(key);

                Map<String, Object> slotInfo = new HashMap<>();
                slotInfo.put("slotDate", currentDate.toString());
                slotInfo.put("startHour", hour);

                int status = 0;
                if (slot != null) {
                    status = slot.getStatus();
                }

                String redisKey = redisUtil.getSlotKey(coachId, currentDate.toString(), hour);
                Object redisStatus = redisUtil.getSlotStatus(redisKey);
                if (redisStatus != null) {
                    status = (Integer) redisStatus;
                }

                slotInfo.put("status", status);
                result.add(slotInfo);
            }
        }

        return result;
    }

    private void validateSlotDate(LocalDate slotDate) {
        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(7);

        if (slotDate.isBefore(today) || slotDate.isEqual(today)) {
            throw new BusinessException("只能设置未来的时段");
        }

        if (slotDate.isAfter(maxDate)) {
            throw new BusinessException("最多只能设置未来7天的时段");
        }
    }

    private void validateHour(Integer hour) {
        if (hour < 8 || hour >= 20) {
            throw new BusinessException("时段只能设置在8:00-20:00之间");
        }
    }
}