package com.psychiatric.controller;

import com.psychiatric.entity.LocationRecord;
import com.psychiatric.service.LocationRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/location-records")
@CrossOrigin(origins = "*")
public class LocationRecordController {
    
    @Autowired
    private LocationRecordService locationRecordService;
    
    @GetMapping
    public List<LocationRecord> getAllRecords() {
        return locationRecordService.getAllRecords();
    }
    
    @GetMapping("/bracelet/{braceletId}")
    public List<LocationRecord> getRecordsByBraceletId(@PathVariable String braceletId) {
        return locationRecordService.getRecordsByBraceletId(braceletId);
    }
    
    @PostMapping
    public LocationRecord addRecord(@RequestBody Map<String, String> request) {
        String braceletId = request.get("braceletId");
        String location = request.get("location");
        return locationRecordService.addRecord(braceletId, location);
    }
}
