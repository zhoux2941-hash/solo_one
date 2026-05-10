package com.petclean.service;

import com.petclean.entity.Building;
import com.petclean.repository.BuildingRepository;
import com.petclean.repository.CleaningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final CleaningRecordRepository cleaningRecordRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BUILDING_POINTS_CACHE_KEY = "building:points:";
    private static final String BUILDING_RANK_CACHE_KEY = "building:rankings";
    private static final long CACHE_TTL = 5;

    public List<Building> getAllBuildings() {
        return buildingRepository.findAll();
    }

    public Optional<Building> getBuildingById(Long id) {
        return buildingRepository.findById(id);
    }

    @SuppressWarnings("unchecked")
    public List<Building> getBuildingsRanked() {
        List<Building> cached = (List<Building>) redisTemplate.opsForValue().get(BUILDING_RANK_CACHE_KEY);
        if (cached != null) {
            log.info("从Redis缓存获取楼栋排行榜");
            return cached;
        }

        List<Building> buildings = buildingRepository.findAllByOrderByTotalPointsDesc();
        if (!buildings.isEmpty()) {
            redisTemplate.opsForValue().set(BUILDING_RANK_CACHE_KEY, buildings, CACHE_TTL, TimeUnit.MINUTES);
            log.info("缓存楼栋排行榜到Redis");
        }
        return buildings;
    }

    public Integer getBuildingPoints(Long buildingId) {
        String cacheKey = BUILDING_POINTS_CACHE_KEY + buildingId;
        Integer cached = (Integer) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("从Redis缓存获取楼栋 {} 积分: {}", buildingId, cached);
            return cached;
        }

        Integer points = cleaningRecordRepository.sumPointsByBuildingId(buildingId);
        if (points == null) {
            points = 0;
        }
        redisTemplate.opsForValue().set(cacheKey, points, CACHE_TTL, TimeUnit.MINUTES);
        return points;
    }

    @Transactional
    public Building updatePoints(Long buildingId, int points) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("楼栋不存在"));
        building.setTotalPoints(building.getTotalPoints() + points);
        Building saved = buildingRepository.save(building);

        evictBuildingCache(buildingId);
        return saved;
    }

    private void evictBuildingCache(Long buildingId) {
        redisTemplate.delete(BUILDING_POINTS_CACHE_KEY + buildingId);
        redisTemplate.delete(BUILDING_RANK_CACHE_KEY);
        log.info("清除楼栋 {} 的Redis缓存", buildingId);
    }
}
