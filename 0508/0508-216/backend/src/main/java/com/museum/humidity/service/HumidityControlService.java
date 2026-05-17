package com.museum.humidity.service;

import com.museum.humidity.entity.ControlType;
import com.museum.humidity.entity.DeviceStatus;
import com.museum.humidity.entity.DisplayCabinet;
import com.museum.humidity.repository.DisplayCabinetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class HumidityControlService {
    @Autowired
    private DisplayCabinetRepository cabinetRepository;

    @Autowired
    private HumidityRecordService recordService;

    @Autowired
    private ControlLogService logService;

    @Value("${control.humidity.deviation-threshold:5.0}")
    private double deviationThreshold;

    private final Random random = new Random();

    @Scheduled(fixedRate = 5000)
    public void simulateSensorReport() {
        List<DisplayCabinet> cabinets = cabinetRepository.findAll();
        
        for (DisplayCabinet cabinet : cabinets) {
            double baseHumidity = cabinet.getCurrentHumidity() != null ? 
                    cabinet.getCurrentHumidity() : 
                    (cabinet.getTargetHumidityMin() + cabinet.getTargetHumidityMax()) / 2;
            
            double fluctuation = (random.nextDouble() - 0.5) * 4;
            double newHumidity = baseHumidity + fluctuation;
            newHumidity = Math.max(30, Math.min(70, newHumidity));
            
            recordService.addRecord(cabinet.getId(), newHumidity);
            performControl(cabinet.getId(), newHumidity);
        }
    }

    public void performControl(Long deviceId, double currentHumidity) {
        DisplayCabinet cabinet = cabinetRepository.findById(deviceId).orElse(null);
        if (cabinet == null) return;

        double targetMin = cabinet.getTargetHumidityMin();
        double targetMax = cabinet.getTargetHumidityMax();
        double targetMid = (targetMin + targetMax) / 2;
        double deviation = currentHumidity - targetMid;

        DeviceStatus newStatus = DeviceStatus.NORMAL;
        String message = "";
        ControlType controlType = null;
        double energyConsumption = 0;

        if (currentHumidity < targetMin - deviationThreshold) {
            newStatus = DeviceStatus.HUMIDIFYING;
            controlType = ControlType.HUMIDIFY;
            message = String.format("当前湿度%.1f%%RH低于目标范围，启动加湿", currentHumidity);
            energyConsumption = 0.5 + random.nextDouble() * 0.5;
        } else if (currentHumidity > targetMax + deviationThreshold) {
            newStatus = DeviceStatus.DEHUMIDIFYING;
            controlType = ControlType.DEHUMIDIFY;
            message = String.format("当前湿度%.1f%%RH高于目标范围，启动除湿", currentHumidity);
            energyConsumption = 0.5 + random.nextDouble() * 0.5;
        } else if (currentHumidity < targetMin || currentHumidity > targetMax) {
            newStatus = DeviceStatus.WARNING;
            controlType = ControlType.WARNING;
            message = String.format("当前湿度%.1f%%RH超出目标范围警告", currentHumidity);
        } else {
            newStatus = DeviceStatus.NORMAL;
            message = String.format("当前湿度%.1f%%RH在目标范围内，系统正常", currentHumidity);
        }

        if (cabinet.getStatus() != newStatus) {
            cabinet.setStatus(newStatus);
            cabinetRepository.save(cabinet);

            if (controlType != null) {
                logService.addLog(deviceId, controlType, message, currentHumidity, currentHumidity, energyConsumption);
            }
        }
    }
}
