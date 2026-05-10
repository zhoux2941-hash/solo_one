package com.astronomy.variablestar.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MagnitudeEstimationResult {

    private BigDecimal estimatedMagnitude;
    
    private BigDecimal magnitudeError;
    
    private BigDecimal estimateFromA;
    
    private BigDecimal estimateFromB;
    
    private BigDecimal difference;
    
    private ConsistencyLevel consistencyLevel;
    
    private String warningMessage;
    
    private String suggestion;
    
    private double weightA;
    
    private double weightB;

    public enum ConsistencyLevel {
        EXCELLENT("极好", "两个参考星的估算结果高度一致"),
        GOOD("良好", "估算结果在合理范围内"),
        FAIR("一般", "存在一定偏差，建议复核"),
        POOR("较差", "偏差较大，请检查参考星选择");
        
        private final String label;
        private final String description;
        
        ConsistencyLevel(String label, String description) {
            this.label = label;
            this.description = description;
        }
        
        public String getLabel() {
            return label;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
