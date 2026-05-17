package com.military.training.service;

import com.military.training.entity.TrainingSubject;
import com.military.training.repository.TrainingSubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TrainingSubjectService {

    @Autowired
    private TrainingSubjectRepository repository;

    public List<TrainingSubject> findAll() {
        return repository.findAll();
    }

    public List<TrainingSubject> findByCategory(String category) {
        return repository.findByCategory(category);
    }

    public Optional<TrainingSubject> findById(Long id) {
        return repository.findById(id);
    }

    public TrainingSubject save(TrainingSubject subject) {
        return repository.save(subject);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public boolean existsByName(String name) {
        return repository.existsByName(name);
    }
}