package com.isstracker.controller;

import com.isstracker.dto.IridiumFlareEvent;
import com.isstracker.service.IridiumPredictionService;
import com.isstracker.service.ObservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/iridium")
public class IridiumPredictionController {
    
    @Autowired
    private IridiumPredictionService iridiumPredictionService;
    
    @Autowired
    private ObservationService observationService;
    
    @GetMapping("/flares")
    public ResponseEntity<?> predictFlares(
            @RequestParam @NotNull(message = "纬度不能为空") 
            @DecimalMin(value = "-90.0", message = "纬度最小值为-90") 
            @DecimalMax(value = "90.0", message = "纬度最大值为90") Double lat,
            @RequestParam @NotNull(message = "经度不能为空") 
            @DecimalMin(value = "-180.0", message = "经度最小值为-180") 
            @DecimalMax(value = "180.0", message = "经度最大值为180") Double lon) {
        
        List<IridiumFlareEvent> events = iridiumPredictionService.predictFlares(lat, lon);
        
        if (!events.isEmpty()) {
            List<String> eventIds = events.stream()
                    .map(IridiumFlareEvent::getEventId)
                    .collect(Collectors.toList());
            
            Map<String, Integer> counts = observationService.getObserverCounts(eventIds);
            events.forEach(event -> {
                event.setObserverCount(counts.getOrDefault(event.getEventId(), 0));
            });
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("latitude", lat);
        response.put("longitude", lon);
        response.put("total", events.size());
        response.put("visibleCount", events.stream().filter(IridiumFlareEvent::getVisible).count());
        response.put("flares", events);
        
        return ResponseEntity.ok(response);
    }
}
