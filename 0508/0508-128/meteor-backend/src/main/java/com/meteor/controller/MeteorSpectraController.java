package com.meteor.controller;

import com.meteor.dto.*;
import com.meteor.entity.EmissionLine;
import com.meteor.entity.MeteorSpectra;
import com.meteor.service.MeteorSpectraService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/spectra")
public class MeteorSpectraController {
    
    private final MeteorSpectraService spectraService;
    
    public MeteorSpectraController(MeteorSpectraService spectraService) {
        this.spectraService = spectraService;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadSpectra(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploaderName", required = false) String uploaderName) {
        try {
            MeteorSpectra spectra = spectraService.uploadSpectra(file, uploaderName);
            return ResponseEntity.ok(spectra);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading file: " + e.getMessage());
        }
    }
    
    @PostMapping("/{id}/calibrate")
    public ResponseEntity<?> calibrateWavelength(
            @PathVariable Long id,
            @RequestBody WavelengthCalibrationRequest request) {
        try {
            MeteorSpectra spectra = spectraService.calibrateWavelength(id, request);
            return ResponseEntity.ok(spectra);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing image: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSpectra(
            @PathVariable Long id,
            @RequestBody UpdateSpectraRequest request) {
        try {
            MeteorSpectra spectra = spectraService.updateSpectra(id, request);
            return ResponseEntity.ok(spectra);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @PostMapping("/{id}/emission-lines")
    public ResponseEntity<?> addEmissionLine(
            @PathVariable Long id,
            @RequestBody EmissionLineRequest request) {
        try {
            EmissionLine line = spectraService.addEmissionLine(id, request);
            return ResponseEntity.ok(line);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @DeleteMapping("/emission-lines/{lineId}")
    public ResponseEntity<?> deleteEmissionLine(@PathVariable Long lineId) {
        spectraService.deleteEmissionLine(lineId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getSpectraDetail(@PathVariable Long id) {
        try {
            SpectraDetailResponse response = spectraService.getSpectraDetail(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<Page<SpectraResponse>> getAllSpectra(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SpectraResponse> spectra = spectraService.getAllSpectra(page, size);
        return ResponseEntity.ok(spectra);
    }
    
    @PostMapping("/search")
    public ResponseEntity<Page<SpectraResponse>> searchSpectra(@RequestBody SearchRequest request) {
        Page<SpectraResponse> spectra = spectraService.searchSpectra(request);
        return ResponseEntity.ok(spectra);
    }
    
    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<?> getThumbnail(@PathVariable Long id) {
        try {
            byte[] thumbnail = spectraService.getThumbnail(id);
            if (thumbnail != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(thumbnail);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}/image")
    public ResponseEntity<?> getOriginalImage(@PathVariable Long id) {
        try {
            byte[] image = spectraService.getOriginalImage(id);
            if (image != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(image);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSpectra(@PathVariable Long id) {
        try {
            spectraService.deleteSpectra(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
