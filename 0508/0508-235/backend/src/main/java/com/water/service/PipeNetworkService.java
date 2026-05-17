package com.water.service;

import com.water.entity.PipeNetwork;
import com.water.entity.Station;
import com.water.repository.PipeNetworkRepository;
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
public class PipeNetworkService {
    @Autowired
    private PipeNetworkRepository pipeNetworkRepository;

    @Autowired
    private StationRepository stationRepository;

    public Page<PipeNetwork> findAll(int page, int size, Long stationId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (stationId != null) {
            return pipeNetworkRepository.findByStationId(stationId, pageable);
        }
        return pipeNetworkRepository.findAll(pageable);
    }

    public Optional<PipeNetwork> findById(Long id) {
        return pipeNetworkRepository.findById(id);
    }

    public Map<String, Object> save(PipeNetwork pipeNetwork, Long stationId) {
        Map<String, Object> result = new HashMap<>();
        
        if (stationId != null) {
            Optional<Station> stationOpt = stationRepository.findById(stationId);
            if (!stationOpt.isPresent()) {
                result.put("success", false);
                result.put("message", "站点不存在");
                return result;
            }
            pipeNetwork.setStation(stationOpt.get());
        }
        
        PipeNetwork savedPipeNetwork = pipeNetworkRepository.save(pipeNetwork);
        result.put("success", true);
        result.put("data", savedPipeNetwork);
        return result;
    }

    public Map<String, Object> markAsAbandoned(Long id) {
        Map<String, Object> result = new HashMap<>();
        Optional<PipeNetwork> pipeNetworkOpt = pipeNetworkRepository.findById(id);
        
        if (!pipeNetworkOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "管网不存在");
            return result;
        }
        
        PipeNetwork pipeNetwork = pipeNetworkOpt.get();
        pipeNetwork.setActive(false);
        pipeNetworkRepository.save(pipeNetwork);
        
        result.put("success", true);
        result.put("message", "标记废弃成功");
        return result;
    }

    public Map<String, Object> toggleActive(Long id) {
        Map<String, Object> result = new HashMap<>();
        Optional<PipeNetwork> pipeNetworkOpt = pipeNetworkRepository.findById(id);
        
        if (!pipeNetworkOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "管网不存在");
            return result;
        }
        
        PipeNetwork pipeNetwork = pipeNetworkOpt.get();
        pipeNetwork.setActive(!pipeNetwork.getActive());
        pipeNetworkRepository.save(pipeNetwork);
        
        result.put("success", true);
        result.put("message", "操作成功");
        return result;
    }
}
