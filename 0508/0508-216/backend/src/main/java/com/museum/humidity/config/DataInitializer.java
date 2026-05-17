package com.museum.humidity.config;

import com.museum.humidity.entity.DeviceStatus;
import com.museum.humidity.entity.DisplayCabinet;
import com.museum.humidity.entity.ExhibitType;
import com.museum.humidity.entity.HumidityRecord;
import com.museum.humidity.repository.DisplayCabinetRepository;
import com.museum.humidity.repository.HumidityRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private DisplayCabinetRepository cabinetRepository;

    @Autowired
    private HumidityRecordRepository recordRepository;

    @Override
    public void run(String... args) throws Exception {
        if (cabinetRepository.count() == 0) {
            DisplayCabinet cabinet1 = new DisplayCabinet();
            cabinet1.setCabinetNumber("A001");
            cabinet1.setExhibitType(ExhibitType.ORGANIC);
            cabinet1.setTargetHumidityMin(50.0);
            cabinet1.setTargetHumidityMax(55.0);
            cabinet1.setCurrentHumidity(52.5);
            cabinet1.setStatus(DeviceStatus.NORMAL);
            cabinetRepository.save(cabinet1);

            DisplayCabinet cabinet2 = new DisplayCabinet();
            cabinet2.setCabinetNumber("A002");
            cabinet2.setExhibitType(ExhibitType.INORGANIC);
            cabinet2.setTargetHumidityMin(40.0);
            cabinet2.setTargetHumidityMax(45.0);
            cabinet2.setCurrentHumidity(47.2);
            cabinet2.setStatus(DeviceStatus.DEHUMIDIFYING);
            cabinetRepository.save(cabinet2);

            DisplayCabinet cabinet3 = new DisplayCabinet();
            cabinet3.setCabinetNumber("B001");
            cabinet3.setExhibitType(ExhibitType.ORGANIC);
            cabinet3.setTargetHumidityMin(50.0);
            cabinet3.setTargetHumidityMax(55.0);
            cabinet3.setCurrentHumidity(44.8);
            cabinet3.setStatus(DeviceStatus.HUMIDIFYING);
            cabinetRepository.save(cabinet3);

            LocalDateTime now = LocalDateTime.now();
            for (int i = 0; i < 50; i++) {
                HumidityRecord record1 = new HumidityRecord();
                record1.setDeviceId(1L);
                record1.setHumidity(50 + Math.random() * 10);
                record1.setTimestamp(now.minusMinutes(i * 15));
                recordRepository.save(record1);

                HumidityRecord record2 = new HumidityRecord();
                record2.setDeviceId(2L);
                record2.setHumidity(40 + Math.random() * 10);
                record2.setTimestamp(now.minusMinutes(i * 15));
                recordRepository.save(record2);

                HumidityRecord record3 = new HumidityRecord();
                record3.setDeviceId(3L);
                record3.setHumidity(50 + Math.random() * 10);
                record3.setTimestamp(now.minusMinutes(i * 15));
                recordRepository.save(record3);
            }
        }
    }
}
