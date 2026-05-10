package com.battery.service;

import com.battery.dto.BatteryResult;
import com.battery.dto.SimulationRequest;
import com.battery.dto.SimulationResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class BatterySimulationService {

    private static final double BASE_DISCHARGE_RATE_PER_MIN = 0.5;
    private static final double REFERENCE_TEMPERATURE = 25.0;
    private static final double TEMPERATURE_SENSITIVITY = 0.015;

    private static final List<String> BATTERY_IDS = Arrays.asList("B1", "B2", "B3", "B4");
    
    private static final List<Double> DIFFERENTIAL_COEFFICIENTS = Arrays.asList(
        0.85,
        1.0,
        1.15,
        1.3
    );

    public SimulationResponse simulate(SimulationRequest request) {
        List<BatteryResult> results = new ArrayList<>();

        for (int i = 0; i < BATTERY_IDS.size(); i++) {
            String batteryId = BATTERY_IDS.get(i);
            double diffCoefficient = DIFFERENTIAL_COEFFICIENTS.get(i);
            results.add(calculateBattery(batteryId, request.getRideTime(), request.getTemperature(), diffCoefficient));
        }

        SimulationResponse response = new SimulationResponse();
        response.setSimulationId(UUID.randomUUID().toString().replace("-", ""));
        response.setTimestamp(System.currentTimeMillis());
        response.setRideTime(request.getRideTime());
        response.setTemperature(request.getTemperature());
        response.setBatteryResults(results);

        return response;
    }

    private BatteryResult calculateBattery(String batteryId, int rideTime, int temperature, double diffCoefficient) {
        double temperatureCoefficient = calculateTemperatureCoefficient(temperature);
        double dischargeRate = BASE_DISCHARGE_RATE_PER_MIN * temperatureCoefficient * diffCoefficient;
        double totalDischarge = dischargeRate * rideTime;

        int initialBattery = 100;
        int remainingBattery = (int) Math.max(0, Math.round(initialBattery - totalDischarge));

        BatteryResult result = new BatteryResult();
        result.setBatteryId(batteryId);
        result.setInitialBattery(initialBattery);
        result.setRemainingBattery(remainingBattery);
        result.setDischargeRate(round(dischargeRate, 4));
        result.setDifferentialCoefficient(diffCoefficient);

        return result;
    }

    private double calculateTemperatureCoefficient(int temperature) {
        if (temperature >= REFERENCE_TEMPERATURE) {
            return 1.0;
        }
        double tempDiff = REFERENCE_TEMPERATURE - temperature;
        return 1.0 + (tempDiff / 10.0) * TEMPERATURE_SENSITIVITY * 10;
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}