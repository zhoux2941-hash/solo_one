package com.canteen.controller;

import com.canteen.dto.DailySummaryDTO;
import com.canteen.dto.EventDTO;
import com.canteen.dto.PredictionDTO;
import com.canteen.service.EventService;
import com.canteen.service.FoodWasteService;
import com.canteen.service.PredictionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FoodWasteController {

    private static final Logger logger = LoggerFactory.getLogger(FoodWasteController.class);

    @Autowired
    private FoodWasteService foodWasteService;

    @Autowired
    private PredictionService predictionService;

    @Autowired
    private EventService eventService;

    @GetMapping("/historical")
    public ResponseEntity<List<DailySummaryDTO>> getHistoricalData(@RequestParam(defaultValue = "30") int days) {
        List<DailySummaryDTO> data = foodWasteService.getRecentData(days);
        logger.info("返回历史数据: {} 条", data.size());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/prediction")
    public ResponseEntity<Map<String, Object>> getPrediction(
            @RequestParam(defaultValue = "0.3") double alpha,
            @RequestParam(defaultValue = "3") int days) {
        
        logger.info("收到预测请求: alpha={}, days={}", alpha, days);
        
        Map<String, Object> result = new HashMap<>();
        List<DailySummaryDTO> historical = foodWasteService.getRecentData(30);
        List<PredictionDTO> predictions = predictionService.predict(alpha, days);
        List<EventDTO> events = eventService.getRecentEvents(60);
        
        logger.info("返回预测数据: 历史{}天, 预测{}天, 事件{}个", historical.size(), predictions.size(), events.size());
        if (!predictions.isEmpty()) {
            logger.info("第一个预测值: 午餐={}, 晚餐={}, 总计={}", 
                    predictions.get(0).getLunch(), 
                    predictions.get(0).getDinner(), 
                    predictions.get(0).getTotal());
        }
        
        result.put("historical", historical);
        result.put("predictions", predictions);
        result.put("events", events);
        result.put("alpha", alpha);
        
        return ResponseEntity.ok(result);
    }
}
