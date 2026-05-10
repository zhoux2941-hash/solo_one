package com.meteor.service;

import com.meteor.entity.MeteorShower;
import com.meteor.repository.MeteorShowerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class MeteorShowerService {

    @Autowired
    private MeteorShowerRepository meteorShowerRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_SHOWERS_CACHE_KEY = "meteor:hot_showers";
    private static final long CACHE_TTL = 1;

    public List<MeteorShower> getAllShowers() {
        return meteorShowerRepository.findAllByOrderByPeakTimeDesc();
    }

    @SuppressWarnings("unchecked")
    public List<MeteorShower> getHotShowers() {
        Object cached = redisTemplate.opsForValue().get(HOT_SHOWERS_CACHE_KEY);
        if (cached != null) {
            return (List<MeteorShower>) cached;
        }

        List<MeteorShower> hotShowers = meteorShowerRepository.findHotShowers();
        if (hotShowers == null || hotShowers.isEmpty()) {
            initializeDefaultShowers();
            hotShowers = meteorShowerRepository.findHotShowers();
        }

        redisTemplate.opsForValue().set(HOT_SHOWERS_CACHE_KEY, hotShowers, CACHE_TTL, TimeUnit.HOURS);
        return hotShowers;
    }

    public Optional<MeteorShower> getShowerByCode(String code) {
        return meteorShowerRepository.findByCode(code);
    }

    public MeteorShower save(MeteorShower shower) {
        MeteorShower saved = meteorShowerRepository.save(shower);
        evictHotShowersCache();
        return saved;
    }

    public void evictHotShowersCache() {
        redisTemplate.delete(HOT_SHOWERS_CACHE_KEY);
    }

    private void initializeDefaultShowers() {
        List<MeteorShower> defaultShowers = Arrays.asList(
                createShower("Quadrantids", "象限仪座流星雨", "QUA", "Boötes",
                        LocalDateTime.of(2026, 1, 4, 0, 0), 2026, true, 120),
                createShower("Lyrids", "天琴座流星雨", "LYR", "Lyra",
                        LocalDateTime.of(2026, 4, 22, 0, 0), 2026, true, 18),
                createShower("Eta Aquarids", "宝瓶座η流星雨", "ETA", "Aquarius",
                        LocalDateTime.of(2026, 5, 6, 0, 0), 2026, true, 50),
                createShower("Perseids", "英仙座流星雨", "PER", "Perseus",
                        LocalDateTime.of(2026, 8, 13, 0, 0), 2026, true, 100),
                createShower("Orionids", "猎户座流星雨", "ORI", "Orion",
                        LocalDateTime.of(2026, 10, 21, 0, 0), 2026, true, 20),
                createShower("Leonids", "狮子座流星雨", "LEO", "Leo",
                        LocalDateTime.of(2026, 11, 17, 0, 0), 2026, true, 15),
                createShower("Geminids", "双子座流星雨", "GEM", "Gemini",
                        LocalDateTime.of(2026, 12, 14, 0, 0), 2026, true, 150),
                createShower("Ursids", "小熊座流星雨", "URS", "Ursa Minor",
                        LocalDateTime.of(2026, 12, 22, 0, 0), 2026, false, 10),
                createShower("Taurids", "金牛座流星雨", "TAU", "Taurus",
                        LocalDateTime.of(2026, 11, 5, 0, 0), 2026, false, 5),
                createShower("Southern Delta Aquarids", "宝瓶座δ南流星雨", "SDA", "Aquarius",
                        LocalDateTime.of(2026, 7, 28, 0, 0), 2026, false, 25)
        );

        for (MeteorShower shower : defaultShowers) {
            Optional<MeteorShower> existing = meteorShowerRepository.findByCode(shower.getCode());
            if (existing.isEmpty()) {
                meteorShowerRepository.save(shower);
            } else {
                MeteorShower dbShower = existing.get();
                if (dbShower.getPredictedZHR() == null) {
                    dbShower.setPredictedZHR(shower.getPredictedZHR());
                    meteorShowerRepository.save(dbShower);
                }
            }
        }
    }

    private MeteorShower createShower(String name, String chineseName, String code,
                                       String radiantConstellation, LocalDateTime peakTime,
                                       Integer year, boolean isHot, Integer predictedZHR) {
        MeteorShower shower = new MeteorShower();
        shower.setName(name);
        shower.setChineseName(chineseName);
        shower.setCode(code);
        shower.setRadiantConstellation(radiantConstellation);
        shower.setPeakTime(peakTime);
        shower.setYear(year);
        shower.setIsHot(isHot);
        shower.setPredictedZHR(predictedZHR);
        return shower;
    }
}
