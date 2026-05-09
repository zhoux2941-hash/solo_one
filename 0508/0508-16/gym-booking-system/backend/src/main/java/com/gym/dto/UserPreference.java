package com.gym.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {
    private Long userId;
    private Map<String, Double> courseTypeWeights;
    private Map<Long, Double> coachWeights;
    
    public static UserPreference create(Long userId) {
        return UserPreference.builder()
            .userId(userId)
            .courseTypeWeights(new HashMap<>())
            .coachWeights(new HashMap<>())
            .build();
    }
    
    public void addCourseType(String courseName, double weight) {
        String type = extractCourseType(courseName);
        courseTypeWeights.merge(type, weight, Double::sum);
    }
    
    public void addCoach(Long coachId, double weight) {
        coachWeights.merge(coachId, weight, Double::sum);
    }
    
    private String extractCourseType(String courseName) {
        if (courseName.contains("瑜伽")) return "瑜伽";
        if (courseName.contains("单车") || courseName.contains("动感")) return "动感单车";
        if (courseName.contains("普拉提")) return "普拉提";
        if (courseName.contains("HIIT")) return "HIIT";
        if (courseName.contains("有氧")) return "有氧";
        if (courseName.contains("力量")) return "力量";
        if (courseName.contains("舞蹈")) return "舞蹈";
        if (courseName.contains("游泳")) return "游泳";
        return courseName;
    }
    
    public void normalize() {
        normalizeMap(courseTypeWeights);
        normalizeMap(coachWeights);
    }
    
    private void normalizeMap(Map<?, Double> map) {
        if (map.isEmpty()) return;
        double max = map.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        if (max == 0) max = 1.0;
        map.replaceAll((k, v) -> v / max);
    }
}
