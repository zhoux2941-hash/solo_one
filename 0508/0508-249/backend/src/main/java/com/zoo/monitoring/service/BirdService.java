package com.zoo.monitoring.service;

import com.zoo.monitoring.entity.Bird;
import com.zoo.monitoring.repository.BirdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BirdService {
    @Autowired
    private BirdRepository birdRepository;

    public List<Bird> findAll() {
        return birdRepository.findAll();
    }

    public Page<Bird> findAll(Pageable pageable) {
        return birdRepository.findAll(pageable);
    }

    public Optional<Bird> findById(Long id) {
        return birdRepository.findById(id);
    }

    public Optional<Bird> findByBirdNo(String birdNo) {
        return birdRepository.findByBirdNo(birdNo);
    }

    public List<Bird> findBySpecies(String species) {
        return birdRepository.findBySpecies(species);
    }

    public List<Bird> findByCageNo(String cageNo) {
        return birdRepository.findByCageNo(cageNo);
    }

    public List<Bird> findQuarantinedBirds() {
        return birdRepository.findByIsQuarantinedTrue();
    }

    @Transactional
    public Bird save(Bird bird) {
        return birdRepository.save(bird);
    }

    @Transactional
    public void delete(Long id) {
        birdRepository.deleteById(id);
    }

    @Transactional
    public Bird setQuarantine(Long id, Boolean isQuarantined) {
        Bird bird = birdRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("鸟类不存在"));
        bird.setIsQuarantined(isQuarantined);
        bird.setHealthStatus(isQuarantined ? "隔离中" : "正常");
        return birdRepository.save(bird);
    }

    public List<String> getAllSpecies() {
        return birdRepository.findAllDistinctSpecies();
    }
}
