package com.loker.cabinet.controller;

import com.loker.cabinet.entity.CabinetCell;
import com.loker.cabinet.entity.PredictionResult;
import com.loker.cabinet.service.CabinetService;
import com.loker.cabinet.service.PredictionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cabinet")
@CrossOrigin(origins = "http://localhost:5173")
public class CabinetController {
    
    private static final Logger logger = LoggerFactory.getLogger(CabinetController.class);
    
    @Autowired
    private CabinetService cabinetService;
    
    @Autowired
    private PredictionService predictionService;
    
    @GetMapping("/fatigue")
    public ResponseEntity<List<CabinetCell>> getAllCellFatigue() {
        try {
            List<CabinetCell> cells = cabinetService.getCellFatigueWithFallback();
            return ResponseEntity.ok(cells);
        } catch (Exception e) {
            logger.error("获取格口疲劳度数据失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/predictions")
    public ResponseEntity<List<PredictionResult>> getAllPredictions() {
        try {
            List<PredictionResult> predictions = predictionService.getHighFrequencyPredictions();
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            logger.error("获取预测数据失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/predictions/danger")
    public ResponseEntity<List<PredictionResult>> getDangerPredictions() {
        try {
            List<PredictionResult> dangerCells = predictionService.getDangerPredictionCells();
            return ResponseEntity.ok(dangerCells);
        } catch (Exception e) {
            logger.error("获取危险格口预测数据失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
