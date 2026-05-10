package com.festival.volunteer.service;

import com.festival.volunteer.dto.CheckInRequest;
import com.festival.volunteer.dto.CheckInStats;
import com.festival.volunteer.entity.CheckIn;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.entity.Schedule;
import com.festival.volunteer.repository.CheckInRepository;
import com.festival.volunteer.repository.PositionRepository;
import com.festival.volunteer.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final ScheduleRepository scheduleRepository;
    private final PositionRepository positionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${application.check-in.code}")
    private String checkInCode;

    private static final String CHECKIN_STATS_KEY = "checkin:stats";
    private static final String CHECKIN_CACHE_KEY_PREFIX = "checkin:position:";
    private static final long CACHE_EXPIRE_SECONDS = 60;

    @Transactional
    public CheckIn checkIn(Long volunteerId, CheckInRequest request) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new RuntimeException("排班不存在"));

        if (!schedule.getVolunteer().getId().equals(volunteerId)) {
            throw new RuntimeException("无权签到此排班");
        }

        if (checkInRepository.existsByScheduleId(schedule.getId())) {
            throw new RuntimeException("已签到，不可重复签到");
        }

        CheckIn.CheckInMethod method;
        if (request.getCheckInCode() != null) {
            if (!request.getCheckInCode().equals(checkInCode)) {
                throw new RuntimeException("签到码错误");
            }
            method = CheckIn.CheckInMethod.CODE;
        } else if (request.getLatitude() != null && request.getLongitude() != null) {
            method = CheckIn.CheckInMethod.GPS;
        } else {
            throw new RuntimeException("请提供签到码或GPS定位信息");
        }

        CheckIn checkIn = new CheckIn();
        checkIn.setSchedule(schedule);
        checkIn.setVolunteer(schedule.getVolunteer());
        checkIn.setPosition(schedule.getPosition());
        checkIn.setCheckInTime(LocalDateTime.now());
        checkIn.setMethod(method);
        checkIn.setCheckInCode(request.getCheckInCode());
        checkIn.setLatitude(request.getLatitude());
        checkIn.setLongitude(request.getLongitude());

        checkIn = checkInRepository.save(checkIn);

        schedule.setStatus(Schedule.ScheduleStatus.CHECKED_IN);
        scheduleRepository.save(schedule);

        updateCheckInCache(schedule.getPosition().getId());

        return checkIn;
    }

    public CheckIn getCheckInByScheduleId(Long scheduleId) {
        return checkInRepository.findByScheduleId(scheduleId)
                .orElse(null);
    }

    public List<CheckIn> getMyCheckIns(Long volunteerId) {
        return checkInRepository.findByVolunteerId(volunteerId);
    }

    public List<CheckInStats> getCheckInStats() {
        @SuppressWarnings("unchecked")
        List<CheckInStats> cached = (List<CheckInStats>) redisTemplate.opsForValue().get(CHECKIN_STATS_KEY);
        if (cached != null) {
            return cached;
        }

        List<CheckInStats> stats = calculateCheckInStats();
        redisTemplate.opsForValue().set(CHECKIN_STATS_KEY, stats, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
        return stats;
    }

    private List<CheckInStats> calculateCheckInStats() {
        List<Position> positions = positionRepository.findAll();
        List<CheckInStats> statsList = new ArrayList<>();

        for (Position position : positions) {
            String cacheKey = CHECKIN_CACHE_KEY_PREFIX + position.getId();
            Long checkedInCount = (Long) redisTemplate.opsForValue().get(cacheKey);
            
            if (checkedInCount == null) {
                checkedInCount = checkInRepository.countByPositionId(position.getId());
                redisTemplate.opsForValue().set(cacheKey, checkedInCount, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
            }

            CheckInStats stats = new CheckInStats();
            stats.setPositionId(position.getId());
            stats.setPositionName(position.getName());
            stats.setPositionType(position.getType());
            stats.setRequiredCount(position.getRequiredCount());
            stats.setCurrentCount(position.getCurrentCount());
            stats.setCheckedInCount(checkedInCount.intValue());
            
            if (position.getCurrentCount() > 0) {
                stats.setCheckInRate((double) checkedInCount / position.getCurrentCount() * 100);
            } else {
                stats.setCheckInRate(0.0);
            }

            statsList.add(stats);
        }

        return statsList;
    }

    private void updateCheckInCache(Long positionId) {
        String cacheKey = CHECKIN_CACHE_KEY_PREFIX + positionId;
        Long checkedInCount = checkInRepository.countByPositionId(positionId);
        redisTemplate.opsForValue().set(cacheKey, checkedInCount, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
        
        List<CheckInStats> allStats = calculateCheckInStats();
        redisTemplate.opsForValue().set(CHECKIN_STATS_KEY, allStats, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
    }

    public List<CheckIn> getAllCheckIns() {
        return checkInRepository.findAll();
    }

    public List<CheckIn> getCheckInsByPosition(Long positionId) {
        return checkInRepository.findByPositionId(positionId);
    }
}
