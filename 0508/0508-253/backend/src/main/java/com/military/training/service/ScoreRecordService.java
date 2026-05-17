package com.military.training.service;

import com.military.training.entity.ScoreRecord;
import com.military.training.repository.ScoreRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreRecordService {

    @Autowired
    private ScoreRecordRepository repository;

    public List<ScoreRecord> findAll() {
        return repository.findAll();
    }

    public List<ScoreRecord> findByTraineeId(Long traineeId) {
        return repository.findByTraineeId(traineeId);
    }

    public List<ScoreRecord> findBySubjectId(Long subjectId) {
        return repository.findBySubjectId(subjectId);
    }

    public Optional<ScoreRecord> findById(Long id) {
        return repository.findById(id);
    }

    public Optional<ScoreRecord> findByTraineeIdAndSubjectId(Long traineeId, Long subjectId) {
        return repository.findByTraineeIdAndSubjectId(traineeId, subjectId);
    }

    public ScoreRecord save(ScoreRecord record) {
        return repository.save(record);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<ScoreRecord> batchSave(List<ScoreRecord> records) {
        return repository.saveAll(records);
    }
}