package com.pottery.simulator.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pottery.simulator.entity.ClassicPottery;
import com.pottery.simulator.repository.ClassicPotteryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ClassicPotteryService {

    @Autowired
    private ClassicPotteryRepository classicPotteryRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY = "classic:pottery:";

    public List<ClassicPottery> listByType(String type) {
        String cacheKey = CACHE_KEY + "list:" + (type == null ? "all" : type);
        List<ClassicPottery> list = (List<ClassicPottery>) redisTemplate.opsForValue().get(cacheKey);
        
        if (list != null) {
            return list;
        }
        
        LambdaQueryWrapper<ClassicPottery> wrapper = new LambdaQueryWrapper<>();
        if (type != null && !type.isEmpty()) {
            wrapper.eq(ClassicPottery::getType, type);
        }
        list = classicPotteryRepository.selectList(wrapper);
        
        redisTemplate.opsForValue().set(cacheKey, list, 30, TimeUnit.MINUTES);
        return list;
    }

    public ClassicPottery getById(Long id) {
        String cacheKey = CACHE_KEY + id;
        ClassicPottery pottery = (ClassicPottery) redisTemplate.opsForValue().get(cacheKey);
        
        if (pottery != null) {
            return pottery;
        }
        
        pottery = classicPotteryRepository.selectById(id);
        
        if (pottery != null) {
            redisTemplate.opsForValue().set(cacheKey, pottery, 1, TimeUnit.HOURS);
        }
        
        return pottery;
    }

}
