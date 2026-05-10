package com.charging.service;

import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import com.charging.repository.ChargingPileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChargingPileService {
    
    private final ChargingPileRepository chargingPileRepository;
    private final RedisCacheService redisCacheService;
    
    public List<ChargingPile> getAllPiles() {
        List<ChargingPile> cachedPiles = redisCacheService.getAllPilesFromCache();
        if (cachedPiles != null && !cachedPiles.isEmpty()) {
            log.info("Getting all piles from cache");
            return cachedPiles;
        }
        
        log.info("Getting all piles from database");
        List<ChargingPile> piles = chargingPileRepository.findAll();
        redisCacheService.cacheAllPiles(piles);
        return piles;
    }
    
    public List<ChargingPile> getPilesByStatus(PileStatus status) {
        return chargingPileRepository.findByStatus(status);
    }
    
    public Optional<ChargingPile> getPileById(Long id) {
        ChargingPile cachedPile = redisCacheService.getPileFromCache(id);
        if (cachedPile != null) {
            return Optional.of(cachedPile);
        }
        
        Optional<ChargingPile> pile = chargingPileRepository.findById(id);
        pile.ifPresent(redisCacheService::cachePile);
        return pile;
    }
    
    public Optional<ChargingPile> getPileByCode(String pileCode) {
        return chargingPileRepository.findByPileCode(pileCode);
    }
    
    @Transactional
    public ChargingPile createPile(ChargingPile pile) {
        if (chargingPileRepository.existsByPileCode(pile.getPileCode())) {
            throw new RuntimeException("充电桩编号已存在");
        }
        
        pile.setStatus(PileStatus.AVAILABLE);
        ChargingPile saved = chargingPileRepository.save(pile);
        redisCacheService.cachePile(saved);
        redisCacheService.deleteKey("charging:piles:all");
        return saved;
    }
    
    @Transactional
    public ChargingPile updatePileStatus(Long id, PileStatus status) {
        ChargingPile pile = chargingPileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
        
        pile.setStatus(status);
        ChargingPile saved = chargingPileRepository.save(pile);
        redisCacheService.cachePile(saved);
        redisCacheService.deleteKey("charging:piles:all");
        return saved;
    }
    
    @Transactional
    public ChargingPile updatePile(Long id, ChargingPile pileDetails) {
        ChargingPile pile = chargingPileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
        
        if (!pile.getPileCode().equals(pileDetails.getPileCode())) {
            if (chargingPileRepository.existsByPileCode(pileDetails.getPileCode())) {
                throw new RuntimeException("充电桩编号已存在");
            }
        }
        
        pile.setPileCode(pileDetails.getPileCode());
        pile.setLocation(pileDetails.getLocation());
        pile.setDescription(pileDetails.getDescription());
        
        if (pileDetails.getStatus() != null) {
            pile.setStatus(pileDetails.getStatus());
        }
        
        ChargingPile saved = chargingPileRepository.save(pile);
        redisCacheService.cachePile(saved);
        redisCacheService.deleteKey("charging:piles:all");
        return saved;
    }
    
    @Transactional
    public void deletePile(Long id) {
        if (!chargingPileRepository.existsById(id)) {
            throw new RuntimeException("充电桩不存在");
        }
        chargingPileRepository.deleteById(id);
        redisCacheService.removePileFromCache(id);
    }
    
    public PileStatus getPileStatus(Long id) {
        PileStatus cachedStatus = redisCacheService.getPileStatusFromCache(id);
        if (cachedStatus != null) {
            return cachedStatus;
        }
        
        return chargingPileRepository.findById(id)
                .map(pile -> {
                    redisCacheService.updatePileStatusInCache(pile);
                    return pile.getStatus();
                })
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
    }
    
    public boolean isPileAvailable(Long id) {
        PileStatus status = getPileStatus(id);
        return status == PileStatus.AVAILABLE;
    }
}
