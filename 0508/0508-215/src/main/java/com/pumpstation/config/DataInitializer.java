package com.pumpstation.config;

import com.pumpstation.entity.PumpStation;
import com.pumpstation.repository.PumpStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private PumpStationRepository pumpStationRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (pumpStationRepository.count() == 0) {
            PumpStation pump1 = new PumpStation();
            pump1.setPumpNo("PUMP-001");
            pump1.setPower(75.0);
            pump1.setStartWaterLevel(3.5);
            pump1.setStopWaterLevel(1.2);
            pump1.setCurrentWaterLevel(2.0);
            pumpStationRepository.save(pump1);
            
            PumpStation pump2 = new PumpStation();
            pump2.setPumpNo("PUMP-002");
            pump2.setPower(90.0);
            pump2.setStartWaterLevel(3.8);
            pump2.setStopWaterLevel(1.5);
            pump2.setCurrentWaterLevel(2.2);
            pumpStationRepository.save(pump2);
            
            PumpStation pump3 = new PumpStation();
            pump3.setPumpNo("PUMP-003");
            pump3.setPower(110.0);
            pump3.setStartWaterLevel(4.0);
            pump3.setStopWaterLevel(1.8);
            pump3.setCurrentWaterLevel(2.5);
            pumpStationRepository.save(pump3);
            
            System.out.println("测试泵站数据初始化完成！");
        }
    }
}
