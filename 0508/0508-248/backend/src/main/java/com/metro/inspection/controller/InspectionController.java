package com.metro.inspection.controller;

import com.metro.inspection.dto.InspectionRecordDTO;
import com.metro.inspection.dto.InspectionResponse;
import com.metro.inspection.entity.InspectionRecord;
import com.metro.inspection.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "*")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @PostMapping
    public ResponseEntity<InspectionResponse> createInspection(@Valid @RequestBody InspectionRecordDTO dto) {
        InspectionResponse response = inspectionService.createInspection(dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllInspections(
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String severityLevel,
            @RequestParam(required = false) String damageType) {
        
        List<InspectionRecord> records = inspectionService.getAllInspections(section, severityLevel, damageType);
        List<Map<String, Object>> result = records.stream().map(this::convertToMap).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getInspectionById(@PathVariable Long id) {
        Optional<InspectionRecord> optional = inspectionService.getInspectionById(id);
        if (optional.isPresent()) {
            return ResponseEntity.ok(convertToMap(optional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteInspection(@PathVariable Long id) {
        boolean deleted = inspectionService.deleteInspection(id);
        Map<String, String> response = new HashMap<>();
        if (deleted) {
            response.put("message", "删除成功");
            return ResponseEntity.ok(response);
        }
        response.put("message", "记录不存在");
        return ResponseEntity.notFound().build();
    }

    private Map<String, Object> convertToMap(InspectionRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("section", record.getSection());
        map.put("mileage", record.getMileage());
        map.put("railPosition", record.getRailPosition());
        map.put("damageType", record.getDamageType());
        map.put("depth", record.getDepth());
        map.put("lineSpeed", record.getLineSpeed());
        map.put("severityLevel", record.getSeverityLevel().getDescription());
        map.put("inspectionDate", record.getInspectionDate().toString());
        map.put("suggestedRepairTime", record.getSuggestedRepairTime());
        return map;
    }
}
