package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.Venue;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class VenueService {

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Optional<Venue> findById(Long id) {
        return venueRepository.findById(id);
    }

    public Optional<Venue> findByVenueCode(String venueCode) {
        return venueRepository.findByVenueCode(venueCode);
    }

    public Page<Venue> findByPage(String keyword, String status, String venueType, Pageable pageable) {
        return venueRepository.findByConditions(keyword, status, venueType, pageable);
    }

    public List<Venue> findByStatus(String status) {
        return venueRepository.findByStatus(status);
    }

    @Transactional
    public Map<String, Object> createVenue(Venue venue, Long managerId) {
        if (venue.getVenueCode() == null || venue.getVenueCode().isEmpty()) {
            venue.setVenueCode("VEN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        if (venueRepository.existsByVenueCode(venue.getVenueCode())) {
            return Map.of("success", false, "message", "场地编码已存在");
        }

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            venue.setManager(manager);
        }

        Venue saved = venueRepository.save(venue);
        return Map.of("success", true, "message", "创建成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> updateVenue(Long id, Venue venue, Long managerId) {
        Venue existing = venueRepository.findById(id).orElse(null);
        if (existing == null) {
            return Map.of("success", false, "message", "场地不存在");
        }

        existing.setVenueName(venue.getVenueName());
        existing.setVenueType(venue.getVenueType());
        existing.setDescription(venue.getDescription());
        existing.setLocation(venue.getLocation());
        existing.setCapacity(venue.getCapacity());
        existing.setHourlyRate(venue.getHourlyRate());
        existing.setDailyRate(venue.getDailyRate());
        existing.setFacilities(venue.getFacilities());
        existing.setStatus(venue.getStatus());
        existing.setRemark(venue.getRemark());

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            existing.setManager(manager);
        }

        Venue saved = venueRepository.save(existing);
        return Map.of("success", true, "message", "更新成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> deleteVenue(Long id) {
        if (!venueRepository.existsById(id)) {
            return Map.of("success", false, "message", "场地不存在");
        }
        venueRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", venueRepository.count());
        result.put("openCount", venueRepository.findByStatus("开放").size());
        result.put("closedCount", venueRepository.findByStatus("关闭").size());
        return result;
    }
}
