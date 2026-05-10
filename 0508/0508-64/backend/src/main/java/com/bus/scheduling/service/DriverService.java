package com.bus.scheduling.service;

import com.bus.scheduling.entity.Driver;
import com.bus.scheduling.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    @PostConstruct
    @Transactional
    public void initDefaultDrivers() {
        if (driverRepository.count() == 0) {
            log.info("初始化默认8名司机数据");
            List<Driver> defaultDrivers = Arrays.asList(
                    createDriver("张师傅", "DRV001", "13800138001"),
                    createDriver("李师傅", "DRV002", "13800138002"),
                    createDriver("王师傅", "DRV003", "13800138003"),
                    createDriver("赵师傅", "DRV004", "13800138004"),
                    createDriver("刘师傅", "DRV005", "13800138005"),
                    createDriver("陈师傅", "DRV006", "13800138006"),
                    createDriver("杨师傅", "DRV007", "13800138007"),
                    createDriver("黄师傅", "DRV008", "13800138008")
            );
            driverRepository.saveAll(defaultDrivers);
        }
    }

    private Driver createDriver(String name, String driverNumber, String phone) {
        Driver driver = new Driver();
        driver.setName(name);
        driver.setDriverNumber(driverNumber);
        driver.setPhone(phone);
        driver.setInitialEnergy(100);
        return driver;
    }

    public List<Driver> getAllDrivers() {
        return driverRepository.findAllByOrderByIdAsc();
    }

    public Driver getDriverById(Long id) {
        return driverRepository.findById(id).orElse(null);
    }
}
