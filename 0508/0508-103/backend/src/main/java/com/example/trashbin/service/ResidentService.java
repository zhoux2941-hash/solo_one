package com.example.trashbin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trashbin.dto.ResidentRegisterDTO;
import com.example.trashbin.entity.Resident;
import com.example.trashbin.mapper.ResidentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ResidentService extends ServiceImpl<ResidentMapper, Resident> {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String POINTS_KEY_PREFIX = "resident:points:";

    @Transactional(rollbackFor = Exception.class)
    public Resident register(ResidentRegisterDTO dto) {
        LambdaQueryWrapper<Resident> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Resident::getRoomNumber, dto.getRoomNumber());
        if (this.count(wrapper) > 0) {
            throw new RuntimeException("该房号已注册");
        }

        Resident resident = new Resident();
        resident.setRoomNumber(dto.getRoomNumber());
        resident.setName(dto.getName());
        resident.setPoints(0);
        this.save(resident);

        redisTemplate.opsForValue().set(POINTS_KEY_PREFIX + resident.getId(), 0, 24, TimeUnit.HOURS);
        return resident;
    }

    public List<Resident> listAll() {
        return this.list();
    }

    public Resident getByIdWithPoints(Long id) {
        Resident resident = this.getById(id);
        if (resident == null) {
            throw new RuntimeException("居民不存在");
        }

        String key = POINTS_KEY_PREFIX + id;
        Integer redisPoints = (Integer) redisTemplate.opsForValue().get(key);
        if (redisPoints != null && !redisPoints.equals(resident.getPoints())) {
            resident.setPoints(redisPoints);
        }
        return resident;
    }

    public Integer getCurrentPoints(Long residentId) {
        String key = POINTS_KEY_PREFIX + residentId;
        Integer points = (Integer) redisTemplate.opsForValue().get(key);
        if (points == null) {
            Resident resident = this.getById(residentId);
            if (resident == null) {
                throw new RuntimeException("居民不存在");
            }
            points = resident.getPoints();
            redisTemplate.opsForValue().set(key, points, 24, TimeUnit.HOURS);
        }
        return points;
    }

    public void syncPointsFromRedis(Long residentId) {
        String key = POINTS_KEY_PREFIX + residentId;
        Integer points = (Integer) redisTemplate.opsForValue().get(key);
        if (points != null) {
            Resident resident = new Resident();
            resident.setId(residentId);
            resident.setPoints(points);
            this.updateById(resident);
        }
    }
}
