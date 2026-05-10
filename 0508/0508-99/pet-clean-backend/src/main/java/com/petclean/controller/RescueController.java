package com.petclean.controller;

import com.petclean.entity.RescuePoint;
import com.petclean.entity.RescueRecord;
import com.petclean.service.RescueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rescue")
@RequiredArgsConstructor
public class RescueController {

    private final RescueService rescueService;

    @GetMapping("/points")
    public ResponseEntity<List<RescuePoint>> getAllRescuePoints() {
        return ResponseEntity.ok(rescueService.getAllRescuePoints());
    }

    @GetMapping("/points/status/{status}")
    public ResponseEntity<List<RescuePoint>> getRescuePointsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(rescueService.getRescuePointsByStatus(status));
    }

    @GetMapping("/points/{id}")
    public ResponseEntity<RescuePoint> getRescuePointById(@PathVariable Long id) {
        Optional<RescuePoint> point = rescueService.getRescuePointById(id);
        return point.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/points/{id}/records")
    public ResponseEntity<List<RescueRecord>> getRecordsByPoint(@PathVariable Long id) {
        return ResponseEntity.ok(rescueService.getRecordsByPoint(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getRescueStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalReported", rescueService.countTotalReported());
        stats.put("totalRescued", rescueService.countTotalRescued());
        stats.put("needRescue", rescueService.countNeedRescue());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/report")
    public ResponseEntity<RescuePoint> reportStrayAnimal(@RequestBody ReportRescueRequest request) {
        RescuePoint point = rescueService.reportStrayAnimal(
                request.getUserId(),
                request.getLatitude(),
                request.getLongitude(),
                request.getAnimalType(),
                request.getDescription(),
                request.getPhotoUrl()
        );
        return ResponseEntity.ok(point);
    }

    @PostMapping("/points/{id}/supply")
    public ResponseEntity<RescuePoint> provideSupplies(
            @PathVariable Long id,
            @RequestBody SupplyRequest request) {
        RescuePoint point = rescueService.provideSupplies(
                id,
                request.getUserId(),
                request.getNote(),
                request.getPhotoUrl()
        );
        return ResponseEntity.ok(point);
    }

    @PostMapping("/points/{id}/rescue")
    public ResponseEntity<RescuePoint> markAsRescued(
            @PathVariable Long id,
            @RequestBody RescueRequest request) {
        RescuePoint point = rescueService.markAsRescued(
                id,
                request.getUserId(),
                request.getRescueNote(),
                request.getPhotoUrl()
        );
        return ResponseEntity.ok(point);
    }

    public static class ReportRescueRequest {
        private Long userId;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String animalType;
        private String description;
        private String photoUrl;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public BigDecimal getLatitude() { return latitude; }
        public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
        public BigDecimal getLongitude() { return longitude; }
        public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
        public String getAnimalType() { return animalType; }
        public void setAnimalType(String animalType) { this.animalType = animalType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }

    public static class SupplyRequest {
        private Long userId;
        private String note;
        private String photoUrl;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }

    public static class RescueRequest {
        private Long userId;
        private String rescueNote;
        private String photoUrl;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getRescueNote() { return rescueNote; }
        public void setRescueNote(String rescueNote) { this.rescueNote = rescueNote; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }
}
