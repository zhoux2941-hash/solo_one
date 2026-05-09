package com.kindergarten.dashboard.service;

import com.kindergarten.dashboard.model.MaterialConsumption;
import com.kindergarten.dashboard.model.MaterialType;
import com.kindergarten.dashboard.repository.MaterialConsumptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialConsumptionRepository consumptionRepository;

    private final Random random = new Random();

    private static final double COLOR_PAPER_MIN = 20.0;
    private static final double COLOR_PAPER_MAX = 50.0;
    private static final double GLUE_MIN = 5.0;
    private static final double GLUE_MAX = 15.0;
    private static final double GLITTER_MIN = 3.0;
    private static final double GLITTER_MAX = 10.0;
    private static final double PIPE_CLEANER_MIN = 5.0;
    private static final double PIPE_CLEANER_MAX = 20.0;

    public Map<String, Object> getTrendData() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        List<MaterialConsumption> consumptions = consumptionRepository
                .findByConsumptionDateBetweenOrderByConsumptionDateAsc(startDate, today);

        if (consumptions.isEmpty()) {
            log.info("No data found in database, generating mock data...");
            consumptions = generateMockTrendData();
        }

        return buildTrendResponse(consumptions, startDate, today);
    }

    public Map<String, Object> getShareData() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        List<Object[]> totals = consumptionRepository.findTotalConsumptionByMaterial(startDate, today);

        Map<MaterialType, Double> consumptionMap = new HashMap<>();
        for (MaterialType type : MaterialType.values()) {
            consumptionMap.put(type, 0.0);
        }

        if (totals.isEmpty()) {
            log.info("No share data found, using mock data...");
            consumptionMap = generateMockShareData();
        } else {
            for (Object[] row : totals) {
                MaterialType type = (MaterialType) row[0];
                Double amount = (Double) row[1];
                consumptionMap.put(type, amount);
            }
        }

        return buildShareResponse(consumptionMap);
    }

    private List<MaterialConsumption> generateMockTrendData() {
        LocalDate today = LocalDate.now();
        List<MaterialConsumption> mockData = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            for (MaterialType type : MaterialType.values()) {
                MaterialConsumption consumption = new MaterialConsumption();
                consumption.setMaterialType(type);
                consumption.setConsumptionDate(date);
                consumption.setUnit(type.getUnit());
                consumption.setAmount(generateDailyAmount(type));
                mockData.add(consumption);
            }
        }

        log.info("Generated {} mock trend data records", mockData.size());
        return mockData;
    }

    private Map<MaterialType, Double> generateMockShareData() {
        Map<MaterialType, Double> shareData = new LinkedHashMap<>();

        for (MaterialType type : MaterialType.values()) {
            double total = 0;
            for (int i = 0; i < 7; i++) {
                total += generateDailyAmount(type);
            }
            shareData.put(type, Math.round(total * 100.0) / 100.0);
        }

        log.info("Generated mock share data for {} materials", shareData.size());
        return shareData;
    }

    private double generateDailyAmount(MaterialType type) {
        double amount = switch (type) {
            case COLOR_PAPER -> COLOR_PAPER_MIN + random.nextDouble() * (COLOR_PAPER_MAX - COLOR_PAPER_MIN);
            case GLUE -> GLUE_MIN + random.nextDouble() * (GLUE_MAX - GLUE_MIN);
            case GLITTER -> GLITTER_MIN + random.nextDouble() * (GLITTER_MAX - GLITTER_MIN);
            case PIPE_CLEANER -> PIPE_CLEANER_MIN + random.nextDouble() * (PIPE_CLEANER_MAX - PIPE_CLEANER_MIN);
        };
        return Math.round(amount * 100.0) / 100.0;
    }

    private Map<String, Object> buildTrendResponse(List<MaterialConsumption> data, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> response = new LinkedHashMap<>();

        List<String> dates = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            dates.add(date.toString());
        }
        response.put("dates", dates);

        Map<MaterialType, List<Double>> materialData = new LinkedHashMap<>();
        for (MaterialType type : MaterialType.values()) {
            materialData.put(type, new ArrayList<>(Collections.nCopies(7, 0.0)));
        }

        for (MaterialConsumption item : data) {
            int dateIndex = (int) item.getConsumptionDate().until(startDate, java.time.temporal.ChronoUnit.DAYS) * -1;
            if (dateIndex >= 0 && dateIndex < 7) {
                materialData.get(item.getMaterialType()).set(dateIndex, item.getAmount());
            }
        }

        List<Map<String, Object>> materials = new ArrayList<>();
        for (MaterialType type : MaterialType.values()) {
            Map<String, Object> materialInfo = new LinkedHashMap<>();
            materialInfo.put("name", type.getDisplayName());
            materialInfo.put("unit", type.getUnit());
            materialInfo.put("data", materialData.get(type));
            materials.add(materialInfo);
        }
        response.put("materials", materials);

        return response;
    }

    private Map<String, Object> buildShareResponse(Map<MaterialType, Double> consumptionMap) {
        Map<String, Object> response = new LinkedHashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();

        double total = consumptionMap.values().stream().mapToDouble(Double::doubleValue).sum();

        for (Map.Entry<MaterialType, Double> entry : consumptionMap.entrySet()) {
            MaterialType type = entry.getKey();
            Double amount = entry.getValue();
            double percentage = total > 0 ? Math.round((amount / total) * 10000.0) / 100.0 : 0;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", type.getDisplayName());
            item.put("unit", type.getUnit());
            item.put("amount", amount);
            item.put("percentage", percentage);
            items.add(item);
        }

        response.put("total", Math.round(total * 100.0) / 100.0);
        response.put("items", items);

        return response;
    }
}
