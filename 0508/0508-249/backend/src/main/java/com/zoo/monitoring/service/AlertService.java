package com.zoo.monitoring.service;

import com.zoo.monitoring.entity.Alert;
import com.zoo.monitoring.entity.Bird;
import com.zoo.monitoring.repository.AlertRepository;
import com.zoo.monitoring.repository.BirdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AlertService {
    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private BirdRepository birdRepository;

    public List<Alert> findAll() {
        List<Alert> alerts = alertRepository.findAll();
        for (Alert alert : alerts) {
            enrichBirdInfo(alert);
        }
        return alerts;
    }

    public Page<Alert> findAll(Pageable pageable) {
        Page<Alert> page = alertRepository.findAll(pageable);
        for (Alert alert : page.getContent()) {
            enrichBirdInfo(alert);
        }
        return page;
    }

    public Optional<Alert> findById(Long id) {
        Optional<Alert> alert = alertRepository.findById(id);
        alert.ifPresent(this::enrichBirdInfo);
        return alert;
    }

    public List<Alert> findUnhandledAlerts() {
        List<Alert> alerts = alertRepository.findByIsHandledFalseOrderByAlertTimeDesc();
        for (Alert alert : alerts) {
            enrichBirdInfo(alert);
        }
        return alerts;
    }

    public List<Alert> findByAlertLevel(String alertLevel) {
        List<Alert> alerts = alertRepository.findByAlertLevelOrderByAlertTimeDesc(alertLevel);
        for (Alert alert : alerts) {
            enrichBirdInfo(alert);
        }
        return alerts;
    }

    private void enrichBirdInfo(Alert alert) {
        if (alert.getBirdId() != null) {
            birdRepository.findById(alert.getBirdId()).ifPresent(bird -> {
                alert.setBirdNo(bird.getBirdNo());
                alert.setSpecies(bird.getSpecies());
                alert.setCageNo(bird.getCageNo());
            });
        }
    }

    @Transactional
    public Alert handleAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预警不存在"));
        alert.setIsHandled(true);
        return alertRepository.save(alert);
    }

    @Transactional
    public void delete(Long id) {
        alertRepository.deleteById(id);
    }
}
