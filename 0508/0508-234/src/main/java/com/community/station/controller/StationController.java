package com.community.station.controller;

import com.community.station.entity.Station;
import com.community.station.service.StationService;
import com.community.station.util.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stations")
@CrossOrigin(origins = "*")
public class StationController {

    @Autowired
    private StationService stationService;

    @GetMapping
    public List<Station> getAllStations() {
        return stationService.getAllStations();
    }

    @GetMapping("/page")
    public PageResult<Station> getStationsByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Station> stationPage = stationService.getStationsByPage(page, size);
        return new PageResult<>(stationPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Station> getStationById(@PathVariable Long id) {
        return stationService.getStationById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Station> searchStations(@RequestParam String name) {
        return stationService.searchStationsByName(name);
    }

    @GetMapping("/search/page")
    public PageResult<Station> searchStationsWithPage(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Station> stationPage = stationService.searchStationsByNameWithPage(name, page, size);
        return new PageResult<>(stationPage);
    }

    @PostMapping
    public ResponseEntity<?> createStation(@RequestBody Station station) {
        try {
            Station createdStation = stationService.createStation(station);
            return ResponseEntity.ok(createdStation);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStation(@PathVariable Long id, @RequestBody Station stationDetails) {
        try {
            Station updatedStation = stationService.updateStation(id, stationDetails);
            return ResponseEntity.ok(updatedStation);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStation(@PathVariable Long id) {
        stationService.deleteStation(id);
        return ResponseEntity.ok().build();
    }
}
