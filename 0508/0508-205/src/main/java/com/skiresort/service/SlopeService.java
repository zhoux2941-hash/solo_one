package com.skiresort.service;

import com.skiresort.model.Slope;
import com.skiresort.model.VisitorRecord;
import com.skiresort.repository.SlopeRepository;
import com.skiresort.repository.VisitorRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SlopeService {

    @Autowired
    private SlopeRepository slopeRepository;

    @Autowired
    private VisitorRecordRepository visitorRecordRepository;

    public List<Slope> getAllSlopes() {
        return slopeRepository.findAll();
    }

    public Optional<Slope> getSlopeById(Long id) {
        return slopeRepository.findById(id);
    }

    @Transactional
    public Slope createSlope(Slope slope) {
        slope.setLastUpdated(LocalDateTime.now());
        return slopeRepository.save(slope);
    }

    @Transactional
    public Slope updateSlopeStatus(Long id, Slope.SlopeStatus status) {
        Slope slope = slopeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("雪道未找到"));
        slope.setStatus(status);
        slope.setLastUpdated(LocalDateTime.now());
        return slopeRepository.save(slope);
    }

    @Transactional
    public Slope updateSlope(Slope slope) {
        slope.setLastUpdated(LocalDateTime.now());
        return slopeRepository.save(slope);
    }

    @Transactional
    public void incrementVisitorCount(Long slopeId) {
        Slope slope = slopeRepository.findById(slopeId)
                .orElseThrow(() -> new RuntimeException("雪道未找到"));
        slope.setVisitorCount(slope.getVisitorCount() + 1);
        slope.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(slope);

        LocalDateTime now = LocalDateTime.now();
        VisitorRecord record = new VisitorRecord();
        record.setSlope(slope);
        record.setVisitorCount(1);
        record.setRecordDate(now.toLocalDate());
        record.setRecordHour(now.getHour());
        record.setRecordTime(now);
        visitorRecordRepository.save(record);
    }

    public List<Slope> getSlopesByStatus(Slope.SlopeStatus status) {
        return slopeRepository.findByStatus(status);
    }

    public List<Slope> getSlopesByDifficulty(Slope.DifficultyLevel difficulty) {
        return slopeRepository.findByDifficulty(difficulty);
    }

    @Transactional
    public void resetDailyVisitorCounts() {
        List<Slope> slopes = slopeRepository.findAll();
        for (Slope slope : slopes) {
            slope.setVisitorCount(0);
            slope.setLastUpdated(LocalDateTime.now());
        }
        slopeRepository.saveAll(slopes);
    }
}
