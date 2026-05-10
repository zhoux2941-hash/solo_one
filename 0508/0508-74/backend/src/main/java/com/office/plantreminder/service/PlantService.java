package com.office.plantreminder.service;

import com.office.plantreminder.dto.UserRankingDTO;
import com.office.plantreminder.entity.Plant;
import com.office.plantreminder.entity.WateringLog;
import com.office.plantreminder.repository.PlantRepository;
import com.office.plantreminder.repository.WateringLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PlantService {

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private WateringLogRepository wateringLogRepository;

    public List<Plant> getAllPlants() {
        return plantRepository.findAll().stream()
                .map(this::calculatePlantStatus)
                .collect(Collectors.toList());
    }

    public Optional<Plant> getPlantById(Long id) {
        return plantRepository.findById(id).map(this::calculatePlantStatus);
    }

    public List<Plant> getOverduePlants() {
        LocalDate today = LocalDate.now();
        return getAllPlants().stream()
                .filter(plant -> plant.getIsOverdue() != null && plant.getIsOverdue())
                .collect(Collectors.toList());
    }

    @Transactional
    public Plant waterPlant(Long plantId, String wateredBy, String notes) {
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new RuntimeException("绿植不存在"));

        LocalDateTime now = LocalDateTime.now();
        plant.setLastWateredAt(now);
        plant.setNextWateringDate(LocalDate.now().plusDays(plant.getWateringIntervalDays()));
        Plant savedPlant = plantRepository.save(plant);

        WateringLog log = new WateringLog();
        log.setPlantId(plantId);
        log.setWateredBy(wateredBy);
        log.setNotes(notes);
        wateringLogRepository.save(log);

        return calculatePlantStatus(savedPlant);
    }

    public List<WateringLog> getWateringLogs(Long plantId) {
        return wateringLogRepository.findByPlantIdOrderByWateredAtDesc(plantId);
    }

    public List<UserRankingDTO> getUserRanking(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> results = wateringLogRepository.countWateringsByUserSince(since);
        
        List<UserRankingDTO> rankings = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            Object[] row = results.get(i);
            String username = (String) row[0];
            Long count = (Long) row[1];
            rankings.add(new UserRankingDTO(username, count, i + 1));
        }
        return rankings;
    }

    private Plant calculatePlantStatus(Plant plant) {
        LocalDate today = LocalDate.now();
        LocalDate nextDate = plant.getNextWateringDate();

        if (nextDate == null) {
            if (plant.getLastWateredAt() != null) {
                nextDate = plant.getLastWateredAt().toLocalDate()
                        .plusDays(plant.getWateringIntervalDays());
            } else {
                nextDate = plant.getCreatedAt().toLocalDate()
                        .plusDays(plant.getWateringIntervalDays());
            }
        }

        long daysUntil = ChronoUnit.DAYS.between(today, nextDate);
        plant.setDaysUntilNextWatering(daysUntil);
        plant.setIsOverdue(daysUntil < 0);

        return plant;
    }
}
