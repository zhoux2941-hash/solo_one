package com.water.service;

import com.water.entity.PipeNetwork;
import com.water.entity.Station;
import com.water.entity.WaterDistrict;
import com.water.repository.PipeNetworkRepository;
import com.water.repository.StationRepository;
import com.water.repository.WaterDistrictRepository;
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
public class WaterDistrictService {
    @Autowired
    private WaterDistrictRepository waterDistrictRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private PipeNetworkRepository pipeNetworkRepository;

    public Page<WaterDistrict> findAll(int page, int size, Long stationId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (stationId != null) {
            return waterDistrictRepository.findByStationId(stationId, pageable);
        }
        return waterDistrictRepository.findAll(pageable);
    }

    public Optional<WaterDistrict> findById(Long id) {
        return waterDistrictRepository.findById(id);
    }

    public Map<String, Object> save(WaterDistrict waterDistrict, Long stationId, Long mainPipeId) {
        Map<String, Object> result = new HashMap<>();
        
        Station selectedStation = null;
        if (stationId != null) {
            Optional<Station> stationOpt = stationRepository.findById(stationId);
            if (!stationOpt.isPresent()) {
                result.put("success", false);
                result.put("message", "站点不存在");
                return result;
            }
            selectedStation = stationOpt.get();
            waterDistrict.setStation(selectedStation);
        }
        
        if (mainPipeId != null) {
            Optional<PipeNetwork> pipeNetworkOpt = pipeNetworkRepository.findById(mainPipeId);
            if (!pipeNetworkOpt.isPresent()) {
                result.put("success", false);
                result.put("message", "管网不存在");
                return result;
            }
            PipeNetwork pipeNetwork = pipeNetworkOpt.get();
            
            if (selectedStation != null && pipeNetwork.getStation() != null 
                && !pipeNetwork.getStation().getId().equals(stationId)) {
                result.put("success", false);
                result.put("message", "所选管网不属于该站点，请重新选择");
                return result;
            }
            waterDistrict.setMainPipe(pipeNetwork);
        }
        
        WaterDistrict savedWaterDistrict = waterDistrictRepository.save(waterDistrict);
        result.put("success", true);
        result.put("data", savedWaterDistrict);
        return result;
    }

    public Map<String, Object> toggleActive(Long id) {
        Map<String, Object> result = new HashMap<>();
        Optional<WaterDistrict> waterDistrictOpt = waterDistrictRepository.findById(id);
        
        if (!waterDistrictOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "片区不存在");
            return result;
        }
        
        WaterDistrict waterDistrict = waterDistrictOpt.get();
        waterDistrict.setActive(!waterDistrict.getActive());
        waterDistrictRepository.save(waterDistrict);
        
        result.put("success", true);
        result.put("message", "操作成功");
        return result;
    }

    public Map<String, Object> changeStation(Long id, Long newStationId) {
        Map<String, Object> result = new HashMap<>();
        Optional<WaterDistrict> waterDistrictOpt = waterDistrictRepository.findById(id);
        
        if (!waterDistrictOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "片区不存在");
            return result;
        }
        
        Optional<Station> stationOpt = stationRepository.findById(newStationId);
        if (!stationOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "新站点不存在");
            return result;
        }
        
        WaterDistrict waterDistrict = waterDistrictOpt.get();
        waterDistrict.setStation(stationOpt.get());
        
        String message = "归属站点变更成功";
        
        PipeNetwork mainPipe = waterDistrict.getMainPipe();
        if (mainPipe != null) {
            Station pipeStation = mainPipe.getStation();
            if (pipeStation == null || !pipeStation.getId().equals(newStationId)) {
                waterDistrict.setMainPipe(null);
                message = "归属站点变更成功，原主管网因不属于新站点已自动解除绑定";
            }
        }
        
        waterDistrictRepository.save(waterDistrict);
        
        result.put("success", true);
        result.put("message", message);
        return result;
    }
}
