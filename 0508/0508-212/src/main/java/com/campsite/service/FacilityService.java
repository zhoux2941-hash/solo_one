package com.campsite.service;

import com.campsite.entity.Facility;
import com.campsite.repository.FacilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacilityService {

    @Autowired
    private FacilityRepository facilityRepository;

    public List<Facility> findAll() {
        return facilityRepository.findAll();
    }

    public Page<Facility> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return facilityRepository.findAll(pageable);
    }

    public Optional<Facility> findById(Long id) {
        return facilityRepository.findById(id);
    }

    public List<Facility> findByFacilityType(String facilityType) {
        return facilityRepository.findByFacilityType(facilityType);
    }

    public Page<Facility> findByFacilityType(String facilityType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return facilityRepository.findByFacilityType(facilityType, pageable);
    }

    public List<Facility> findByStatus(String status) {
        return facilityRepository.findByStatus(status);
    }

    public Page<Facility> findByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return facilityRepository.findByStatus(status, pageable);
    }

    public Facility save(Facility facility) {
        return facilityRepository.save(facility);
    }

    public void deleteById(Long id) {
        facilityRepository.deleteById(id);
    }

    public Facility update(Long id, Facility facility) {
        Optional<Facility> existingOpt = facilityRepository.findById(id);
        if (existingOpt.isPresent()) {
            Facility existing = existingOpt.get();
            existing.setFacilityName(facility.getFacilityName());
            existing.setFacilityType(facility.getFacilityType());
            existing.setLocation(facility.getLocation());
            existing.setQuantity(facility.getQuantity());
            existing.setStatus(facility.getStatus());
            existing.setConditionLevel(facility.getConditionLevel());
            existing.setLastMaintenanceDate(facility.getLastMaintenanceDate());
            existing.setDescription(facility.getDescription());
            return facilityRepository.save(existing);
        }
        return null;
    }
}
