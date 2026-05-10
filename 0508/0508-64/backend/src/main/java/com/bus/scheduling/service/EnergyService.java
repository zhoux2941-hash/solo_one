package com.bus.scheduling.service;

import com.bus.scheduling.config.SchedulingProperties;
import com.bus.scheduling.dto.DriverEnergyDTO;
import com.bus.scheduling.entity.Driver;
import com.bus.scheduling.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergyService {

    private static final String ENERGY_KEY_PREFIX = "driver:energy:";
    private static final long ENERGY_EXPIRE_HOURS = 24;

    private final RedisTemplate<String, Object> redisTemplate;
    private final DriverRepository driverRepository;
    private final SchedulingProperties properties;

    public Integer getCurrentEnergy(Long driverId) {
        String key = ENERGY_KEY_PREFIX + driverId;
        Object energy = redisTemplate.opsForValue().get(key);
        Driver driver = driverRepository.findById(driverId).orElse(null);
        String driverName = driver != null ? driver.getName() : "unknown";
        
        if (energy != null) {
            int value = ((Number) energy).intValue();
            log.info("从 Redis 读取司机 {} ({}) 精力值: {}", driverName, driverId, value);
            return value;
        }
        
        log.warn("Redis 中未找到司机 {} ({}) 的精力值，使用初始值", driverName, driverId);
        if (driver != null) {
            Integer initialEnergy = driver.getInitialEnergy() != null ? driver.getInitialEnergy() : properties.getInitialEnergy();
            setCurrentEnergy(driverId, initialEnergy);
            return initialEnergy;
        }
        return properties.getInitialEnergy();
    }

    public void setCurrentEnergy(Long driverId, Integer energy) {
        String key = ENERGY_KEY_PREFIX + driverId;
        Integer clampedEnergy = Math.max(0, Math.min(100, energy));
        redisTemplate.opsForValue().set(key, clampedEnergy, ENERGY_EXPIRE_HOURS, TimeUnit.HOURS);
        log.info("Driver {} ({}) 精力值更新为: {}", driverId, driverRepository.findById(driverId).map(Driver::getName).orElse("unknown"), clampedEnergy);
    }

    public void updateEnergyAfterDriving(Long driverId, int drivingHours) {
        int currentEnergy = getCurrentEnergy(driverId);
        int cost = drivingHours * properties.getDrivingEnergyCostPerHour();
        setCurrentEnergy(driverId, currentEnergy - cost);
    }

    public void updateEnergyAfterRest(Long driverId, int restMinutes) {
        int currentEnergy = getCurrentEnergy(driverId);
        int recovery = (restMinutes / 30) * properties.getRestEnergyRecoveryPer30min();
        setCurrentEnergy(driverId, currentEnergy + recovery);
    }

    public boolean isFatigued(Long driverId) {
        return getCurrentEnergy(driverId) < properties.getFatigueThreshold();
    }

    public List<DriverEnergyDTO> getAllDriverEnergies() {
        List<Driver> drivers = driverRepository.findAllByOrderByIdAsc();
        List<DriverEnergyDTO> energies = new ArrayList<>();
        for (Driver driver : drivers) {
            Integer currentEnergy = getCurrentEnergy(driver.getId());
            energies.add(new DriverEnergyDTO(
                    driver.getId(),
                    driver.getName(),
                    driver.getDriverNumber(),
                    currentEnergy,
                    driver.getInitialEnergy(),
                    currentEnergy < properties.getFatigueThreshold()
            ));
        }
        return energies;
    }

    public void resetAllEnergies() {
        List<Driver> drivers = driverRepository.findAllByOrderByIdAsc();
        for (Driver driver : drivers) {
            setCurrentEnergy(driver.getId(), properties.getInitialEnergy());
        }
    }
}
