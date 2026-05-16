package com.skiresort.service;

import com.skiresort.model.Lift;
import com.skiresort.model.QueueRecord;
import com.skiresort.repository.LiftRepository;
import com.skiresort.repository.QueueRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LiftService {

    @Autowired
    private LiftRepository liftRepository;

    @Autowired
    private QueueRecordRepository queueRecordRepository;

    public List<Lift> getAllLifts() {
        return liftRepository.findAll();
    }

    public List<Lift> getActiveLifts() {
        return liftRepository.findByIsActiveTrue();
    }

    public Optional<Lift> getLiftById(Long id) {
        return liftRepository.findById(id);
    }

    @Transactional
    public Lift createLift(Lift lift) {
        lift.setLastUpdated(LocalDateTime.now());
        return liftRepository.save(lift);
    }

    @Transactional
    public Lift updateLiftQueue(Long liftId, Integer queueSize, String recordedBy) {
        Lift lift = liftRepository.findById(liftId)
                .orElseThrow(() -> new RuntimeException("缆车未找到"));
        lift.setCurrentQueue(queueSize);
        lift.setLastUpdated(LocalDateTime.now());
        Lift savedLift = liftRepository.save(lift);

        QueueRecord record = new QueueRecord();
        record.setLift(lift);
        record.setQueueSize(queueSize);
        record.setWaitTimeMinutes(lift.getEstimatedWaitTimeMinutes());
        record.setRecordTime(LocalDateTime.now());
        record.setRecordedBy(recordedBy);
        queueRecordRepository.save(record);

        return savedLift;
    }

    @Transactional
    public Lift updateLift(Lift lift) {
        lift.setLastUpdated(LocalDateTime.now());
        return liftRepository.save(lift);
    }

    @Transactional
    public Lift toggleLiftStatus(Long id) {
        Lift lift = liftRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("缆车未找到"));
        lift.setIsActive(!lift.getIsActive());
        lift.setLastUpdated(LocalDateTime.now());
        return liftRepository.save(lift);
    }

    public List<Lift> getLiftsByType(Lift.LiftType type) {
        return liftRepository.findByType(type);
    }
}
