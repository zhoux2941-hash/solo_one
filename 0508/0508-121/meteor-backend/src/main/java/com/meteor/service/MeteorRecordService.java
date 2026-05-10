package com.meteor.service;

import com.meteor.dto.MeteorRecordRequest;
import com.meteor.entity.MeteorRecord;
import com.meteor.entity.ObservationSession;
import com.meteor.repository.MeteorRecordRepository;
import com.meteor.repository.ObservationSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MeteorRecordService {

    @Autowired
    private MeteorRecordRepository recordRepository;

    @Autowired
    private ObservationSessionRepository sessionRepository;

    @Transactional
    public MeteorRecord addRecord(Long sessionId, MeteorRecordRequest request) {
        ObservationSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new RuntimeException("Session is not active");
        }

        MeteorRecord record = new MeteorRecord();
        record.setSession(session);
        record.setConstellation(request.getConstellation());
        record.setBrightness(request.getBrightness());
        record.setColor(request.getColor());
        record.setTrajectoryStartRA(request.getTrajectoryStartRA());
        record.setTrajectoryStartDec(request.getTrajectoryStartDec());
        record.setTrajectoryEndRA(request.getTrajectoryEndRA());
        record.setTrajectoryEndDec(request.getTrajectoryEndDec());
        record.setNotes(request.getNotes());

        return recordRepository.save(record);
    }

    public Optional<MeteorRecord> getRecord(Long id) {
        return recordRepository.findById(id);
    }

    public List<MeteorRecord> getRecordsBySession(Long sessionId) {
        return recordRepository.findBySessionIdOrderByObservedTimeAsc(sessionId);
    }

    public Long countBySession(Long sessionId) {
        return recordRepository.countBySessionId(sessionId);
    }

    @Transactional
    public void deleteRecord(Long id) {
        recordRepository.deleteById(id);
    }
}
