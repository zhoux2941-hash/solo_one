package com.astronomy.variablestar.controller;

import com.astronomy.variablestar.dto.PeriodDetectionRequestDTO;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO;
import com.astronomy.variablestar.service.PeriodDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/period")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PeriodDetectionController {

    private final PeriodDetectionService periodDetectionService;

    @PostMapping("/detect")
    public ResponseEntity<PeriodDetectionResultDTO> detectPeriod(
            @RequestBody PeriodDetectionRequestDTO request) {
        PeriodDetectionResultDTO result = periodDetectionService.detectPeriod(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/star/{starId}")
    public ResponseEntity<PeriodDetectionResultDTO> detectPeriodForStar(
            @PathVariable Long starId) {
        PeriodDetectionResultDTO result = periodDetectionService.detectPeriodForStar(starId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload")
    public ResponseEntity<PeriodDetectionResultDTO> uploadAndDetect(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "starId", required = false) Long starId,
            @RequestParam(value = "smoothMethod", defaultValue = "SAVITZKY_GOLAY") String smoothMethod,
            @RequestParam(value = "windowSize", defaultValue = "7") Integer windowSize,
            @RequestParam(value = "phaseBins", defaultValue = "50") Integer phaseBins,
            @RequestParam(value = "useCustomPeriod", defaultValue = "false") Boolean useCustomPeriod,
            @RequestParam(value = "customPeriod", required = false) Double customPeriod,
            @RequestParam(value = "customEpoch", required = false) Double customEpoch) {
        
        try {
            List<PeriodDetectionRequestDTO.ObservationPoint> observations = parseCsvFile(file);
            
            PeriodDetectionRequestDTO request = new PeriodDetectionRequestDTO();
            request.setStarId(starId);
            request.setSmoothMethod(smoothMethod);
            request.setWindowSize(windowSize);
            request.setPhaseBins(phaseBins);
            request.setUseCustomPeriod(useCustomPeriod);
            request.setCustomPeriod(customPeriod);
            request.setCustomEpoch(customEpoch);
            request.setObservations(observations);
            
            PeriodDetectionResultDTO result = periodDetectionService.detectPeriod(request);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            PeriodDetectionResultDTO result = new PeriodDetectionResultDTO();
            result.setSuccess(false);
            result.setMessage("文件解析失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    private List<PeriodDetectionRequestDTO.ObservationPoint> parseCsvFile(MultipartFile file) throws Exception {
        List<PeriodDetectionRequestDTO.ObservationPoint> observations = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            String line;
            boolean isFirstLine = true;
            int jdColumn = -1;
            int magColumn = -1;
            int errorColumn = -1;
            int timeColumn = -1;
            
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                
                String[] parts = line.split(",");
                
                if (isFirstLine) {
                    isFirstLine = false;
                    for (int i = 0; i < parts.length; i++) {
                        String header = parts[i].trim().toLowerCase();
                        if (header.contains("jd") || header.contains("儒略日") || header.contains("julian")) {
                            jdColumn = i;
                        } else if (header.contains("mag") || header.contains("星等") || header.contains("magnitude")) {
                            magColumn = i;
                        } else if (header.contains("error") || header.contains("误差") || header.contains("err")) {
                            errorColumn = i;
                        } else if (header.contains("time") || header.contains("时间") || header.contains("date")) {
                            timeColumn = i;
                        }
                    }
                    
                    if (magColumn < 0) {
                        throw new Exception("CSV文件必须包含星等(mag)列");
                    }
                    continue;
                }
                
                if (parts.length <= Math.max(magColumn, 0)) continue;
                
                try {
                    PeriodDetectionRequestDTO.ObservationPoint point = 
                        new PeriodDetectionRequestDTO.ObservationPoint();
                    
                    if (jdColumn >= 0 && jdColumn < parts.length) {
                        point.setJulianDate(Double.parseDouble(parts[jdColumn].trim()));
                    } else if (timeColumn >= 0 && timeColumn < parts.length) {
                        point.setObservationTime(parts[timeColumn].trim());
                    }
                    
                    if (magColumn >= 0 && magColumn < parts.length) {
                        point.setMagnitude(Double.parseDouble(parts[magColumn].trim()));
                    }
                    
                    if (errorColumn >= 0 && errorColumn < parts.length && !parts[errorColumn].trim().isEmpty()) {
                        point.setMagnitudeError(Double.parseDouble(parts[errorColumn].trim()));
                    } else {
                        point.setMagnitudeError(0.15);
                    }
                    
                    if (point.getMagnitude() != null) {
                        observations.add(point);
                    }
                    
                } catch (NumberFormatException e) {
                    continue;
                }
            }
            
            if (observations.isEmpty()) {
                throw new Exception("未能从CSV文件中解析出有效的观测数据");
            }
        }
        
        return observations;
    }
}
