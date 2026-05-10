package com.graftingassistant.service;

import com.graftingassistant.entity.Plant;
import com.graftingassistant.entity.Plant.PlantType;
import com.graftingassistant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlantService {
    
    private final PlantRepository plantRepository;
    
    @Cacheable(value = "rootstocks")
    public List<Plant> getAllRootstocks() {
        return plantRepository.findByTypeIn(Arrays.asList(PlantType.ROOTSTOCK, PlantType.BOTH));
    }
    
    @Cacheable(value = "scions")
    public List<Plant> getAllScions() {
        return plantRepository.findByTypeIn(Arrays.asList(PlantType.SCION, PlantType.BOTH));
    }
}
