package com.example.trashbin.service;

import com.example.trashbin.dto.EcoStarDTO;
import com.example.trashbin.dto.RankDTO;
import com.example.trashbin.mapper.GarbageRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RankingService {

    @Autowired
    private GarbageRecordMapper garbageRecordMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String MONTHLY_RANK_KEY = "ranking:monthly:";
    private static final String TOTAL_RANK_KEY = "ranking:total";
    private static final String ECO_STAR_KEY = "eco_star:";

    public List<RankDTO> getMonthlyTop10(Integer year, Integer month) {
        if (year == null || month == null) {
            LocalDate now = LocalDate.now();
            year = now.getYear();
            month = now.getMonthValue();
        }

        String cacheKey = MONTHLY_RANK_KEY + year + "_" + month;
        List<RankDTO> cachedList = (List<RankDTO>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedList != null && !cachedList.isEmpty()) {
            return cachedList;
        }

        List<RankDTO> result = garbageRecordMapper.getMonthlyRank(year, month, 10);
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }

        if (!result.isEmpty()) {
            redisTemplate.opsForValue().set(cacheKey, result, 10, TimeUnit.MINUTES);
        }

        return result;
    }

    public List<RankDTO> getTotalTop10() {
        List<RankDTO> cachedList = (List<RankDTO>) redisTemplate.opsForValue().get(TOTAL_RANK_KEY);
        if (cachedList != null && !cachedList.isEmpty()) {
            return cachedList;
        }

        List<RankDTO> result = garbageRecordMapper.getTotalRank(10);
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }

        if (!result.isEmpty()) {
            redisTemplate.opsForValue().set(TOTAL_RANK_KEY, result, 10, TimeUnit.MINUTES);
        }

        return result;
    }

    public EcoStarDTO getEcoStar(Integer year, Integer month) {
        if (year == null || month == null) {
            LocalDate now = LocalDate.now();
            year = now.getYear();
            month = now.getMonthValue();
        }

        String cacheKey = ECO_STAR_KEY + year + "_" + month;
        EcoStarDTO cached = (EcoStarDTO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<RankDTO> topList = garbageRecordMapper.getMonthlyRank(year, month, 1);
        if (topList == null || topList.isEmpty()) {
            EcoStarDTO emptyStar = new EcoStarDTO();
            emptyStar.setYear(year);
            emptyStar.setMonth(month);
            emptyStar.setTitle("本月暂无环保之星");
            return emptyStar;
        }

        RankDTO topRank = topList.get(0);
        EcoStarDTO ecoStar = new EcoStarDTO();
        ecoStar.setResidentId(topRank.getResidentId());
        ecoStar.setRoomNumber(topRank.getRoomNumber());
        ecoStar.setName(topRank.getName());
        ecoStar.setTotalPoints(topRank.getTotalPoints());
        ecoStar.setYear(year);
        ecoStar.setMonth(month);
        ecoStar.setTitle(year + "年" + month + "月环保之星");

        redisTemplate.opsForValue().set(cacheKey, ecoStar, 30, TimeUnit.MINUTES);

        return ecoStar;
    }

    public void clearMonthlyCache(Integer year, Integer month) {
        if (year == null || month == null) {
            LocalDate now = LocalDate.now();
            year = now.getYear();
            month = now.getMonthValue();
        }
        String cacheKey = MONTHLY_RANK_KEY + year + "_" + month;
        redisTemplate.delete(cacheKey);
    }

    public void clearTotalCache() {
        redisTemplate.delete(TOTAL_RANK_KEY);
    }

    public void clearEcoStarCache(Integer year, Integer month) {
        if (year == null || month == null) {
            LocalDate now = LocalDate.now();
            year = now.getYear();
            month = now.getMonthValue();
        }
        String cacheKey = ECO_STAR_KEY + year + "_" + month;
        redisTemplate.delete(cacheKey);
    }
}
