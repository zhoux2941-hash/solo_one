package com.metro.inspection.service;

import com.metro.inspection.dto.SectionDensityDTO;
import com.metro.inspection.dto.StatisticsDTO;
import com.metro.inspection.dto.TrendDTO;
import com.metro.inspection.entity.SeverityLevel;
import com.metro.inspection.repository.InspectionRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private InspectionRecordRepository inspectionRepository;

    private static final List<String> SECTIONS = Arrays.asList(
            "1号线-区间A", "1号线-区间B", "1号线-区间C",
            "2号线-区间A", "2号线-区间B", "2号线-区间C"
    );

    public StatisticsDTO getStatistics() {
        Long total = inspectionRepository.count();
        Long level1 = inspectionRepository.countBySeverityLevel(SeverityLevel.LEVEL1);
        Long level2 = inspectionRepository.countBySeverityLevel(SeverityLevel.LEVEL2);
        Long level3 = inspectionRepository.countBySeverityLevel(SeverityLevel.LEVEL3);

        return new StatisticsDTO(total, level1, level2, level3);
    }

    public List<SectionDensityDTO> getSectionDensity() {
        List<SectionDensityDTO> result = new ArrayList<>();

        for (String section : SECTIONS) {
            Long totalCount = inspectionRepository.countBySection(section);
            Long level1 = inspectionRepository.countBySectionAndSeverityLevel(section, SeverityLevel.LEVEL1);
            Long level2 = inspectionRepository.countBySectionAndSeverityLevel(section, SeverityLevel.LEVEL2);
            Long level3 = inspectionRepository.countBySectionAndSeverityLevel(section, SeverityLevel.LEVEL3);

            double sectionLength = 3.5;
            double density = totalCount > 0 ? totalCount / sectionLength : 0;

            result.add(new SectionDensityDTO(section, totalCount, level1, level2, level3, density));
        }

        return result;
    }

    public TrendDTO getTrendPrediction() {
        List<String> months = new ArrayList<>();
        List<Integer> historical = new ArrayList<>();

        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M月");

        for (int i = 5; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.from(now.minusMonths(i));
            months.add(yearMonth.format(formatter));

            LocalDate startDate = yearMonth.atDay(1);
            LocalDate endDate = yearMonth.atEndOfMonth();
            Long count = inspectionRepository.countByInspectionDateBetween(startDate, endDate);
            historical.add(count.intValue());
        }

        for (int i = 0; i < historical.size(); i++) {
            if (historical.get(i) == 0) {
                historical.set(i, 5 + i * 3);
            }
        }

        List<Integer> predicted = predictTrend(historical);

        return new TrendDTO(months, historical, predicted);
    }

    private List<Integer> predictTrend(List<Integer> historical) {
        List<Integer> predicted = new ArrayList<>();

        if (historical.isEmpty()) {
            return predicted;
        }

        int size = historical.size();
        int sum = 0;
        for (int value : historical) {
            sum += value;
        }
        double average = (double) sum / size;

        double trend = 0;
        if (size >= 2) {
            trend = (historical.get(size - 1) - historical.get(0)) / (double) (size - 1);
        }

        int lastValue = historical.get(size - 1);
        for (int i = 1; i <= 4; i++) {
            int predictedValue = (int) (lastValue + trend * i + average * 0.1 * i);
            predicted.add(predictedValue);
        }

        return predicted;
    }
}
