package com.swimming.lanematcher.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "swimming")
public class LaneConfig {

    private List<LaneSetting> lanes;

    public List<LaneSetting> getLanes() {
        return lanes;
    }

    public void setLanes(List<LaneSetting> lanes) {
        this.lanes = lanes;
    }

    public static class LaneSetting {
        private Integer id;
        private String name;
        private Double minSpeed;
        private Double maxSpeed;

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Double getMinSpeed() {
            return minSpeed;
        }

        public void setMinSpeed(Double minSpeed) {
            this.minSpeed = minSpeed;
        }

        public Double getMaxSpeed() {
            return maxSpeed;
        }

        public void setMaxSpeed(Double maxSpeed) {
            this.maxSpeed = maxSpeed;
        }
    }
}