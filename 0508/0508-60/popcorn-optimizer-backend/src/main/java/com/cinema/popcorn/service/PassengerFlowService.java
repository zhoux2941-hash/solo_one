package com.cinema.popcorn.service;

import com.cinema.popcorn.entity.PassengerFlowHistory;
import com.cinema.popcorn.repository.PassengerFlowHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PassengerFlowService {
    
    private final PassengerFlowHistoryRepository repository;

    @Transactional
    public PassengerFlowHistory save(PassengerFlowHistory history) {
        log.info("保存客流数据: 日期={}, 小时={}, 客流量={}", 
                history.getRecordDate(), history.getHourOfDay(), history.getPassengerCount());
        return repository.save(history);
    }

    @Transactional
    public List<PassengerFlowHistory> saveBatch(List<PassengerFlowHistory> histories) {
        log.info("批量保存客流数据: {} 条", histories.size());
        return repository.saveAll(histories);
    }

    public List<PassengerFlowHistory> getByDate(LocalDate date) {
        return repository.findByRecordDateOrderByHourOfDayAsc(date);
    }

    public List<PassengerFlowHistory> getByDateRange(LocalDate start, LocalDate end) {
        return repository.findByRecordDateBetweenOrderByRecordDateDesc(start, end);
    }

    public List<PassengerFlowHistory> getPeakHourData(LocalDate date, int startHour, int endHour) {
        return repository.findByDateAndHourRange(date, startHour, endHour);
    }

    public Double getAverageByHourAndDay(int hour, int dayOfWeek) {
        return repository.findAveragePassengerCountByHourAndDay(hour, dayOfWeek);
    }
}
