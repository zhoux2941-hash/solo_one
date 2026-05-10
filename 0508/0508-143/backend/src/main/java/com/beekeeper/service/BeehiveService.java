package com.beekeeper.service;

import com.beekeeper.dto.BeehiveDTO;
import com.beekeeper.entity.Beehive;
import com.beekeeper.repository.BeehiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BeehiveService {
    
    private final BeehiveRepository beehiveRepository;
    
    @Transactional
    @CacheEvict(value = "beehives", allEntries = true)
    public Beehive createBeehive(BeehiveDTO dto) {
        if (beehiveRepository.existsByHiveNumber(dto.getHiveNumber())) {
            throw new RuntimeException("蜂箱编号已存在");
        }
        
        Beehive beehive = new Beehive();
        beehive.setHiveNumber(dto.getHiveNumber());
        beehive.setLocation(dto.getLocation());
        beehive.setDescription(dto.getDescription());
        beehive.setCreatedAt(LocalDateTime.now());
        beehive.setUpdatedAt(LocalDateTime.now());
        
        return beehiveRepository.save(beehive);
    }
    
    @Transactional
    @CacheEvict(value = "beehives", allEntries = true)
    public Beehive updateBeehive(Long id, BeehiveDTO dto) {
        Beehive beehive = beehiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("蜂箱不存在"));
        
        if (!beehive.getHiveNumber().equals(dto.getHiveNumber()) 
                && beehiveRepository.existsByHiveNumber(dto.getHiveNumber())) {
            throw new RuntimeException("蜂箱编号已存在");
        }
        
        beehive.setHiveNumber(dto.getHiveNumber());
        beehive.setLocation(dto.getLocation());
        beehive.setDescription(dto.getDescription());
        beehive.setUpdatedAt(LocalDateTime.now());
        
        return beehiveRepository.save(beehive);
    }
    
    @Transactional
    @CacheEvict(value = "beehives", allEntries = true)
    public void deleteBeehive(Long id) {
        if (!beehiveRepository.existsById(id)) {
            throw new RuntimeException("蜂箱不存在");
        }
        beehiveRepository.deleteById(id);
    }
    
    @Cacheable(value = "beehives", key = "#id")
    public Beehive getBeehive(Long id) {
        return beehiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("蜂箱不存在"));
    }
    
    @Cacheable(value = "beehives", key = "'all'")
    public List<Beehive> getAllBeehives() {
        return beehiveRepository.findAll();
    }
}
