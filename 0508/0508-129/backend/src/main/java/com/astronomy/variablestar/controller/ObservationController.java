package com.astronomy.variablestar.controller;

import com.astronomy.variablestar.dto.LightCurveDataDTO;
import com.astronomy.variablestar.dto.ObservationRequestDTO;
import com.astronomy.variablestar.dto.ObservationResponseDTO;
import com.astronomy.variablestar.service.ObservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/observations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ObservationController {

    private final ObservationService observationService;

    @PostMapping
    public ResponseEntity<ObservationResponseDTO> createObservation(
            @Valid @RequestBody ObservationRequestDTO request) {
        ObservationResponseDTO response = observationService.createObservation(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/star/{starId}")
    public ResponseEntity<List<ObservationResponseDTO>> getObservationsByStar(
            @PathVariable Long starId) {
        List<ObservationResponseDTO> observations = 
            observationService.getObservationsByStar(starId);
        return ResponseEntity.ok(observations);
    }

    @GetMapping("/lightcurve/{starId}")
    public ResponseEntity<LightCurveDataDTO> getLightCurveData(
            @PathVariable Long starId) {
        LightCurveDataDTO data = observationService.getLightCurveData(starId);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/export/{starId}")
    public ResponseEntity<byte[]> exportObservations(@PathVariable Long starId) {
        byte[] csvData = observationService.exportObservationsToCsv(starId);
        
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "observations_star_" + starId + "_" + timestamp + ".csv";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
            .replace("+", "%20");

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(csvData.length))
            .body(csvData);
    }

    @DeleteMapping("/cache/{starId}")
    public ResponseEntity<Void> clearCache(@PathVariable Long starId) {
        observationService.clearLightCurveCache(starId);
        return ResponseEntity.noContent().build();
    }
}
