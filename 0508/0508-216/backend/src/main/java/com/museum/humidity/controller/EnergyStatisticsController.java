package com.museum.humidity.controller;

import com.museum.humidity.entity.DisplayCabinet;
import com.museum.humidity.service.ControlLogService;
import com.museum.humidity.service.DisplayCabinetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/energy-statistics")
public class EnergyStatisticsController {
    @Autowired
    private ControlLogService logService;

    @Autowired
    private DisplayCabinetService cabinetService;

    @GetMapping
    public Map<String, Object> getEnergyStatistics(@RequestParam(required = false, defaultValue = "today") String period) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start;
        int days;

        switch (period) {
            case "week":
                start = end.minusDays(7);
                days = 7;
                break;
            case "month":
                start = end.minusDays(30);
                days = 30;
                break;
            default:
                start = end.toLocalDate().atStartOfDay();
                days = 1;
        }

        List<String> labels = new ArrayList<>();
        List<Double> humidifyData = new ArrayList<>();
        List<Double> dehumidifyData = new ArrayList<>();

        List<DisplayCabinet> cabinets = cabinetService.getAllCabinets();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = end.toLocalDate().minusDays(i);
            labels.add(date.format(DateTimeFormatter.ofPattern("M/d")));

            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            double totalHumidify = 0;
            double totalDehumidify = 0;

            for (DisplayCabinet cabinet : cabinets) {
                Double humidify = logService.getHumidifyEnergyConsumption(cabinet.getId(), dayStart, dayEnd);
                Double dehumidify = logService.getDehumidifyEnergyConsumption(cabinet.getId(), dayStart, dayEnd);
                totalHumidify += humidify != null ? humidify : 0;
                totalDehumidify += dehumidify != null ? dehumidify : 0;
            }

            humidifyData.add(Math.round(totalHumidify * 100.0) / 100.0);
            dehumidifyData.add(Math.round(totalDehumidify * 100.0) / 100.0);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("humidifyData", humidifyData);
        result.put("dehumidifyData", dehumidifyData);

        return result;
    }
}
