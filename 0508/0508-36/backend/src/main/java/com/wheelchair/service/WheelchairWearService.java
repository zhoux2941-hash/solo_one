package com.wheelchair.service;

import com.wheelchair.dto.WearDataResponse;
import com.wheelchair.dto.YearOverYearResponse;
import com.wheelchair.entity.BrakeWearRecord;
import com.wheelchair.repository.BrakeWearRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WheelchairWearService {

    private final BrakeWearRepository wearRepository;

    private static final LocalDate TODAY = LocalDate.of(2026, 5, 9);

    public List<WearDataResponse> getCurrentWearData() {
        List<BrakeWearRecord> latestRecords = wearRepository.findLatestRecordsForAllWheelchairs();
        
        return latestRecords.stream()
                .map(record -> new WearDataResponse(
                        record.getWheelchairId(),
                        record.getWearValue(),
                        record.getRecordDate().toString()
                ))
                .sorted(Comparator.comparing(WearDataResponse::getWheelchairId))
                .toList();
    }

    public List<YearOverYearResponse> getYearOverYearData() {
        List<String> wheelchairIds = wearRepository.findAllWheelchairIds();
        List<YearOverYearResponse> responses = new ArrayList<>();

        YearMonth currentMonth = YearMonth.from(TODAY);
        YearMonth lastMonth = currentMonth.minusMonths(1);

        LocalDate currentMonthStart = currentMonth.atDay(1);
        LocalDate currentMonthEnd = TODAY;
        LocalDate lastMonthStart = lastMonth.atDay(1);
        LocalDate lastMonthEnd = lastMonth.atEndOfMonth();

        for (String wheelchairId : wheelchairIds) {
            Double currentAvg = wearRepository.findAverageWearByWheelchairIdAndDateBetween(
                    wheelchairId, currentMonthStart, currentMonthEnd);
            Double lastMonthAvg = wearRepository.findAverageWearByWheelchairIdAndDateBetween(
                    wheelchairId, lastMonthStart, lastMonthEnd);

            int currentMonthWear = (currentAvg != null) ? (int) Math.round(currentAvg) : 0;
            int lastMonthWear = (lastMonthAvg != null) ? (int) Math.round(lastMonthAvg) : 0;

            double growthRate = 0.0;
            if (lastMonthWear > 0) {
                growthRate = ((double) (currentMonthWear - lastMonthWear) / lastMonthWear) * 100;
            } else if (currentMonthWear > 0) {
                growthRate = 100.0;
            }

            responses.add(new YearOverYearResponse(
                    wheelchairId,
                    Math.round(growthRate * 100.0) / 100.0,
                    lastMonthWear,
                    currentMonthWear
            ));
        }

        return responses.stream()
                .sorted(Comparator.comparing(YearOverYearResponse::getWheelchairId))
                .toList();
    }
}
