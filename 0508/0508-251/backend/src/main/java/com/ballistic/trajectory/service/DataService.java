package com.ballistic.trajectory.service;

import com.ballistic.trajectory.dto.CalculationResult;
import com.ballistic.trajectory.model.TrajectoryRecord;
import com.ballistic.trajectory.repository.TrajectoryRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DataService {

    @Autowired
    private TrajectoryRecordRepository recordRepository;

    public CalculationResult getAllRecords() {
        List<TrajectoryRecord> records = recordRepository.findAllOrderByCreatedAtDesc();
        return CalculationResult.success()
            .put("records", records)
            .put("count", records.size());
    }

    public CalculationResult getRecordsByType(String type) {
        List<TrajectoryRecord> records = recordRepository.findByRecordType(type);
        return CalculationResult.success()
            .put("records", records)
            .put("count", records.size());
    }

    public CalculationResult getRecordById(Long id) {
        Optional<TrajectoryRecord> record = recordRepository.findById(id);
        if (record.isPresent()) {
            return CalculationResult.success()
                .put("record", record.get());
        }
        return CalculationResult.error("记录不存在");
    }

    public CalculationResult deleteRecord(Long id) {
        if (recordRepository.existsById(id)) {
            recordRepository.deleteById(id);
            return CalculationResult.success()
                .put("message", "删除成功")
                .put("id", id);
        }
        return CalculationResult.error("记录不存在");
    }

    public CalculationResult getStatistics() {
        long totalRecords = recordRepository.count();
        long slopeRecords = recordRepository.countByRecordType("slope");
        long ballisticRecords = recordRepository.countByRecordType("ballistic");
        long windRecords = recordRepository.countByRecordType("wind");

        List<TrajectoryRecord> recentRecords = recordRepository.findTop10ByOrderByCreatedAtDesc();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", totalRecords);
        stats.put("slopeRecords", slopeRecords);
        stats.put("ballisticRecords", ballisticRecords);
        stats.put("windRecords", windRecords);
        stats.put("recentRecords", recentRecords);

        return CalculationResult.success()
            .put("statistics", stats);
    }

    public CalculationResult getRecordsByDateRange(LocalDateTime start, LocalDateTime end) {
        List<TrajectoryRecord> records = recordRepository.findByCreatedAtBetween(start, end);
        return CalculationResult.success()
            .put("records", records)
            .put("count", records.size());
    }

    public CalculationResult getRecordsByDistanceRange(Double minDistance, Double maxDistance) {
        List<TrajectoryRecord> records = recordRepository.findByDistanceRange(minDistance, maxDistance);
        return CalculationResult.success()
            .put("records", records)
            .put("count", records.size());
    }

    public CalculationResult getRecordsPaged(int page, int size) {
        Page<TrajectoryRecord> recordPage = recordRepository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return CalculationResult.success()
            .put("records", recordPage.getContent())
            .put("totalElements", recordPage.getTotalElements())
            .put("totalPages", recordPage.getTotalPages())
            .put("currentPage", page);
    }
}
