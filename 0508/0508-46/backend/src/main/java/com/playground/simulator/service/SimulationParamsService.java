package com.playground.simulator.service;

import com.playground.simulator.dto.ChildDTO;
import com.playground.simulator.dto.SimulationParamsDTO;
import com.playground.simulator.entity.SimulationParams;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class SimulationParamsService {

    private static final String PARAMS_KEY = "slide:simulation:params";
    private static final long TIMEOUT = 24;

    private final RedisTemplate<String, Object> redisTemplate;

    public SimulationParamsService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveParams(SimulationParamsDTO paramsDTO) {
        SimulationParams params = convertToEntity(paramsDTO);
        redisTemplate.opsForValue().set(PARAMS_KEY, params, TIMEOUT, TimeUnit.HOURS);
    }

    public SimulationParamsDTO getParams() {
        SimulationParams params = (SimulationParams) redisTemplate.opsForValue().get(PARAMS_KEY);
        if (params == null) {
            return getDefaultParams();
        }
        return convertToDTO(params);
    }

    private SimulationParamsDTO getDefaultParams() {
        List<ChildDTO> defaultChildren = new ArrayList<>();
        defaultChildren.add(new ChildDTO("小明", 5));
        defaultChildren.add(new ChildDTO("小红", 7));
        defaultChildren.add(new ChildDTO("小刚", 9));
        return new SimulationParamsDTO(defaultChildren, 30, 10, 120);
    }

    private SimulationParams convertToEntity(SimulationParamsDTO dto) {
        List<SimulationParams.Child> children = dto.getChildren().stream()
                .map(child -> new SimulationParams.Child(child.getName(), child.getAge()))
                .collect(Collectors.toList());
        return new SimulationParams(
                children,
                dto.getPatienceCoefficient(),
                dto.getSlideUsageTime(),
                dto.getTotalSimulationTime()
        );
    }

    private SimulationParamsDTO convertToDTO(SimulationParams entity) {
        List<ChildDTO> children = entity.getChildren().stream()
                .map(child -> new ChildDTO(child.getName(), child.getAge()))
                .collect(Collectors.toList());
        return new SimulationParamsDTO(
                children,
                entity.getPatienceCoefficient(),
                entity.getSlideUsageTime(),
                entity.getTotalSimulationTime()
        );
    }
}
