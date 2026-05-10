package com.battery.entity;

import com.alibaba.fastjson.JSON;
import com.battery.dto.SimulationResponse;
import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "simulation_log")
@Data
@NoArgsConstructor
public class SimulationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulation_id", nullable = false, length = 50)
    private String simulationId;

    @Column(name = "ride_time", nullable = false)
    private Integer rideTime;

    @Column(name = "temperature", nullable = false)
    private Integer temperature;

    @Lob
    @Column(name = "result_json")
    private String resultJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public static SimulationLog fromResponse(SimulationResponse response) {
        SimulationLog log = new SimulationLog();
        log.setSimulationId(response.getSimulationId());
        log.setRideTime(response.getRideTime());
        log.setTemperature(response.getTemperature());
        log.setResultJson(JSON.toJSONString(response.getBatteryResults()));
        log.setCreatedAt(LocalDateTime.now());
        return log;
    }
}