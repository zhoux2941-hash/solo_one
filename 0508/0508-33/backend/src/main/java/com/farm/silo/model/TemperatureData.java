package com.farm.silo.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

public class TemperatureData implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @JsonProperty("timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    @JsonProperty("temperatureMatrix")
    private List<List<Double>> temperatureMatrix;
    
    @JsonProperty("siloNames")
    private String[] siloNames;
    
    @JsonProperty("layerNames")
    private String[] layerNames;
    
    public TemperatureData() {
    }
    
    public TemperatureData(LocalDateTime timestamp, List<List<Double>> temperatureMatrix, 
                           String[] siloNames, String[] layerNames) {
        this.timestamp = timestamp;
        this.temperatureMatrix = temperatureMatrix;
        this.siloNames = siloNames;
        this.layerNames = layerNames;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public List<List<Double>> getTemperatureMatrix() {
        return temperatureMatrix;
    }
    
    public void setTemperatureMatrix(List<List<Double>> temperatureMatrix) {
        this.temperatureMatrix = temperatureMatrix;
    }
    
    public String[] getSiloNames() {
        return siloNames;
    }
    
    public void setSiloNames(String[] siloNames) {
        this.siloNames = siloNames;
    }
    
    public String[] getLayerNames() {
        return layerNames;
    }
    
    public void setLayerNames(String[] layerNames) {
        this.layerNames = layerNames;
    }
    
    @Override
    public String toString() {
        return "TemperatureData{" +
                "timestamp=" + timestamp +
                ", temperatureMatrix=" + temperatureMatrix +
                '}';
    }
}
