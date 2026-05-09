package com.playground.simulator.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("SimulationParams")
public class SimulationParams implements Serializable {
    private List<Child> children;
    private int patienceCoefficient;
    private int slideUsageTime;
    private int totalSimulationTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Child implements Serializable {
        private String name;
        private int age;
    }
}
