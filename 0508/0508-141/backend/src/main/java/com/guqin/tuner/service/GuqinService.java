package com.guqin.tuner.service;

import com.guqin.tuner.entity.Guqin;
import com.guqin.tuner.mapper.GuqinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class GuqinService {

    @Autowired
    private GuqinRepository guqinRepository;

    @Cacheable(value = "guqinList", key = "'all'")
    public List<Guqin> getAllGuqins() {
        return guqinRepository.findAll();
    }

    @Cacheable(value = "guqin", key = "#id")
    public Optional<Guqin> getGuqinById(Long id) {
        return guqinRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = {"guqinList", "guqin"}, allEntries = true)
    public Guqin createGuqin(Guqin guqin) {
        return guqinRepository.save(guqin);
    }

    @Transactional
    @CacheEvict(value = {"guqinList", "guqin"}, allEntries = true)
    public Optional<Guqin> updateGuqin(Long id, Guqin guqinDetails) {
        return guqinRepository.findById(id).map(guqin -> {
            guqin.setName(guqinDetails.getName());
            guqin.setStringLength(guqinDetails.getStringLength());
            guqin.setDescription(guqinDetails.getDescription());
            return guqinRepository.save(guqin);
        });
    }

    @Transactional
    @CacheEvict(value = {"guqinList", "guqin", "tuningRecord", "comparison"}, allEntries = true)
    public boolean deleteGuqin(Long id) {
        if (guqinRepository.existsById(id)) {
            guqinRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
