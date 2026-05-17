package com.darkroom.film.service;

import com.darkroom.film.entity.ProcessStep;
import com.darkroom.film.repository.ProcessStepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProcessStepService {
    @Autowired
    private ProcessStepRepository processStepRepository;

    public List<ProcessStep> findAll() {
        return processStepRepository.findAll();
    }

    public Page<ProcessStep> findAll(Pageable pageable) {
        return processStepRepository.findAll(pageable);
    }

    public Optional<ProcessStep> findById(Long id) {
        return processStepRepository.findById(id);
    }

    public List<ProcessStep> findByFilmId(Long filmId) {
        return processStepRepository.findByFilmIdOrderByStartTimeAsc(filmId);
    }

    public ProcessStep save(ProcessStep processStep) {
        return processStepRepository.save(processStep);
    }

    public void deleteById(Long id) {
        processStepRepository.deleteById(id);
    }
}