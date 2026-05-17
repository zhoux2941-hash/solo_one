package com.water.service;

import com.water.entity.Station;
import com.water.repository.StationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class StationService {
    @Autowired
    private StationRepository stationRepository;

    public Page<Station> findAll(int page, int size, String region) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (region != null && !region.isEmpty()) {
            return stationRepository.findByRegion(region, pageable);
        }
        return stationRepository.findAll(pageable);
    }

    public Optional<Station> findById(Long id) {
        return stationRepository.findById(id);
    }

    public Map<String, Object> save(Station station) {
        Map<String, Object> result = new HashMap<>();
        Station savedStation = stationRepository.save(station);
        result.put("success", true);
        result.put("data", savedStation);
        return result;
    }

    public Map<String, Object> toggleActive(Long id) {
        Map<String, Object> result = new HashMap<>();
        Optional<Station> stationOpt = stationRepository.findById(id);
        
        if (!stationOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "站点不存在");
            return result;
        }
        
        Station station = stationOpt.get();
        station.setActive(!station.getActive());
        stationRepository.save(station);
        
        result.put("success", true);
        result.put("message", "操作成功");
        return result;
    }
}
