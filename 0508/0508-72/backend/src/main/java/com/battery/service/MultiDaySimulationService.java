package com.battery.service;

import com.battery.dto.DailyBatteryData;
import com.battery.dto.MultiDayRequest;
import com.battery.dto.MultiDayResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MultiDaySimulationService {

    private static final double BASE_DISCHARGE_RATE_PER_MIN = 0.5;
    private static final double REFERENCE_TEMPERATURE = 25.0;
    private static final double TEMPERATURE_SENSITIVITY = 0.015;

    private static final double FULL_VOLTAGE = 4.2;
    private static final double EMPTY_VOLTAGE = 3.0;

    private static final List<String> BATTERY_IDS = Arrays.asList("B1", "B2", "B3", "B4");
    
    private static final List<Double> DIFFERENTIAL_COEFFICIENTS = Arrays.asList(
        0.85,
        1.0,
        1.15,
        1.3
    );

    public MultiDayResponse simulate(MultiDayRequest request) {
        int ridesPerDay = request.getRidesPerDay();
        int rideTime = request.getRideTime();
        int temperature = request.getTemperature();
        int chargeTarget = request.getChargeTarget();
        int totalDays = request.getDays();

        Map<String, List<DailyBatteryData>> dailyDataMap = new LinkedHashMap<>();
        for (String batteryId : BATTERY_IDS) {
            dailyDataMap.put(batteryId, new ArrayList<>());
        }

        int[] currentBattery = new int[BATTERY_IDS.size()];
        Arrays.fill(currentBattery, 100);

        double[] dischargeRates = new double[BATTERY_IDS.size()];
        for (int i = 0; i < BATTERY_IDS.size(); i++) {
            double tempCoefficient = calculateTemperatureCoefficient(temperature);
            dischargeRates[i] = BASE_DISCHARGE_RATE_PER_MIN * tempCoefficient * DIFFERENTIAL_COEFFICIENTS.get(i);
        }

        for (int day = 1; day <= totalDays; day++) {
            int[] startBattery = Arrays.copyOf(currentBattery, currentBattery.length);

            for (int ride = 0; ride < ridesPerDay; ride++) {
                for (int i = 0; i < BATTERY_IDS.size(); i++) {
                    double discharge = dischargeRates[i] * rideTime;
                    currentBattery[i] = (int) Math.max(0, Math.round(currentBattery[i] - discharge));
                }
            }

            int[] afterRideBattery = Arrays.copyOf(currentBattery, currentBattery.length);

            for (int i = 0; i < BATTERY_IDS.size(); i++) {
                if (currentBattery[i] < chargeTarget) {
                    currentBattery[i] = chargeTarget;
                }
            }

            for (int i = 0; i < BATTERY_IDS.size(); i++) {
                String batteryId = BATTERY_IDS.get(i);
                DailyBatteryData data = new DailyBatteryData();
                data.setBatteryId(batteryId);
                data.setDay(day);
                data.setBatteryPercent(afterRideBattery[i]);
                data.setVoltage(percentToVoltage(afterRideBattery[i]));
                data.setAfterChargePercent(currentBattery[i]);
                data.setAfterChargeVoltage(percentToVoltage(currentBattery[i]));
                dailyDataMap.get(batteryId).add(data);
            }
        }

        MultiDayResponse response = new MultiDayResponse();
        response.setSimulationId(UUID.randomUUID().toString().replace("-", ""));
        response.setTimestamp(System.currentTimeMillis());
        response.setRidesPerDay(ridesPerDay);
        response.setRideTime(rideTime);
        response.setTemperature(temperature);
        response.setChargeTarget(chargeTarget);
        response.setTotalDays(totalDays);
        response.setDailyData(dailyDataMap);
        response.setBatteryIds(new ArrayList<>(BATTERY_IDS));

        return response;
    }

    private double calculateTemperatureCoefficient(int temperature) {
        if (temperature >= REFERENCE_TEMPERATURE) {
            return 1.0;
        }
        double tempDiff = REFERENCE_TEMPERATURE - temperature;
        return 1.0 + (tempDiff / 10.0) * TEMPERATURE_SENSITIVITY * 10;
    }

    private double percentToVoltage(int percent) {
        double p = Math.max(0, Math.min(100, percent)) / 100.0;
        double voltage = EMPTY_VOLTAGE + p * (FULL_VOLTAGE - EMPTY_VOLTAGE);
        return round(voltage, 3);
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}