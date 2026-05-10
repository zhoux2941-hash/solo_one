package com.festival.volunteer.controller;

import com.festival.volunteer.dto.ApiResponse;
import com.festival.volunteer.dto.CheckInStats;
import com.festival.volunteer.dto.HeatMapStats;
import com.festival.volunteer.dto.PositionRequest;
import com.festival.volunteer.entity.CheckIn;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.service.CheckInService;
import com.festival.volunteer.service.ExcelExportService;
import com.festival.volunteer.service.HeatMapService;
import com.festival.volunteer.service.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final PositionService positionService;
    private final CheckInService checkInService;
    private final ExcelExportService excelExportService;
    private final HeatMapService heatMapService;

    @PostMapping("/position")
    public ApiResponse<Position> createPosition(@Valid @RequestBody PositionRequest request) {
        try {
            Position position = positionService.createPosition(request);
            return ApiResponse.success("岗位创建成功", position);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/position/{id}")
    public ApiResponse<Position> updatePosition(
            @PathVariable Long id,
            @Valid @RequestBody PositionRequest request) {
        try {
            Position position = positionService.updatePosition(id, request);
            return ApiResponse.success("岗位更新成功", position);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/position/{id}")
    public ApiResponse<Void> deletePosition(@PathVariable Long id) {
        try {
            positionService.deletePosition(id);
            return ApiResponse.success("岗位已停用", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/checkin-stats")
    public ApiResponse<List<CheckInStats>> getCheckInStats() {
        return ApiResponse.success(checkInService.getCheckInStats());
    }

    @GetMapping("/checkins")
    public ApiResponse<List<CheckIn>> getAllCheckIns() {
        return ApiResponse.success(checkInService.getAllCheckIns());
    }

    @GetMapping("/checkins/position/{positionId}")
    public ApiResponse<List<CheckIn>> getCheckInsByPosition(@PathVariable Long positionId) {
        return ApiResponse.success(checkInService.getCheckInsByPosition(positionId));
    }

    @GetMapping("/export/schedules")
    public ResponseEntity<byte[]> exportSchedules() {
        try {
            byte[] excelData = excelExportService.exportScheduleExcel();
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String filename = "排班表_" + timestamp + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/heat-map")
    public ApiResponse<List<HeatMapStats>> getHeatMapData() {
        return ApiResponse.success(heatMapService.getHeatMapData());
    }

    @GetMapping("/heat-map/by-position")
    public ApiResponse<Map<String, Object>> getHeatMapDataByPosition() {
        return ApiResponse.success(heatMapService.getHeatMapDataByPosition());
    }
}
