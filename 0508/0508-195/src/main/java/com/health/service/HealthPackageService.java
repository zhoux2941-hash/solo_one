package com.health.service;

import com.health.entity.HealthPackage;
import com.health.repository.HealthPackageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.List;

@Service
public class HealthPackageService {

    @Autowired
    private HealthPackageRepository packageRepository;

    @PostConstruct
    public void initPackages() {
        if (packageRepository.count() == 0) {
            HealthPackage basic = new HealthPackage();
            basic.setName("基础体检套餐");
            basic.setDescription("身高、体重、血压、血常规、尿常规、肝功能、肾功能、心电图、胸片");
            basic.setPrice(new BigDecimal("299"));
            basic.setType("BASIC");
            packageRepository.save(basic);

            HealthPackage premium = new HealthPackage();
            premium.setName("升级体检套餐");
            premium.setDescription("基础套餐+甲状腺功能、肿瘤标志物、腹部彩超、甲状腺彩超、颈椎DR");
            premium.setPrice(new BigDecimal("599"));
            premium.setType("PREMIUM");
            packageRepository.save(premium);
        }
    }

    public List<HealthPackage> getAllPackages() {
        return packageRepository.findAll();
    }

    public HealthPackage getPackageById(Long id) {
        return packageRepository.findById(id).orElse(null);
    }
}
