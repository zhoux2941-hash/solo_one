package com.campsite.service;

import com.campsite.entity.CampArea;
import com.campsite.repository.CampAreaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CampAreaService {

    @Autowired
    private CampAreaRepository campAreaRepository;

    public List<CampArea> findAll() {
        return campAreaRepository.findAll();
    }

    public Page<CampArea> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return campAreaRepository.findAll(pageable);
    }

    public Optional<CampArea> findById(Long id) {
        return campAreaRepository.findById(id);
    }

    public List<CampArea> findByAreaType(String areaType) {
        return campAreaRepository.findByAreaType(areaType);
    }

    public Page<CampArea> findByAreaType(String areaType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return campAreaRepository.findByAreaType(areaType, pageable);
    }

    public List<CampArea> findByStatus(String status) {
        return campAreaRepository.findByStatus(status);
    }

    public Page<CampArea> findByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return campAreaRepository.findByStatus(status, pageable);
    }

    public CampArea save(CampArea campArea) {
        return campAreaRepository.save(campArea);
    }

    public void deleteById(Long id) {
        campAreaRepository.deleteById(id);
    }

    public CampArea update(Long id, CampArea campArea) {
        Optional<CampArea> existingOpt = campAreaRepository.findById(id);
        if (existingOpt.isPresent()) {
            CampArea existing = existingOpt.get();
            existing.setAreaName(campArea.getAreaName());
            existing.setAreaType(campArea.getAreaType());
            existing.setLocation(campArea.getLocation());
            existing.setAreaSize(campArea.getAreaSize());
            existing.setMaxCapacity(campArea.getMaxCapacity());
            existing.setStatus(campArea.getStatus());
            existing.setDescription(campArea.getDescription());
            return campAreaRepository.save(existing);
        }
        return null;
    }
}
