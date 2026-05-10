package com.petclean.controller;

import com.petclean.dto.CleaningResponse;
import com.petclean.entity.CleaningRecord;
import com.petclean.service.CleaningRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cleaning-records")
@RequiredArgsConstructor
public class CleaningRecordController {

    private final CleaningRecordService cleaningRecordService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CleaningRecord>> getUserRecords(@PathVariable Long userId) {
        return ResponseEntity.ok(cleaningRecordService.getUserRecords(userId));
    }

    @GetMapping("/point/{pointId}")
    public ResponseEntity<List<CleaningRecord>> getPointRecords(@PathVariable Long pointId) {
        return ResponseEntity.ok(cleaningRecordService.getPointRecords(pointId));
    }

    @PostMapping
    public ResponseEntity<CleaningResponse> createCleaningRecord(@RequestBody CreateRecordRequest request) {
        CleaningResponse response = cleaningRecordService.createCleaningRecord(
                request.getUserId(),
                request.getLatitude(),
                request.getLongitude(),
                request.getDescription(),
                request.getPhotoUrl()
        );
        return ResponseEntity.ok(response);
    }

    public static class CreateRecordRequest {
        private Long userId;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String description;
        private String photoUrl;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public BigDecimal getLatitude() { return latitude; }
        public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
        public BigDecimal getLongitude() { return longitude; }
        public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }
}
