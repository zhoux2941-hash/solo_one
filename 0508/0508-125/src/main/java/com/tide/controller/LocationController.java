package com.tide.controller;

import com.tide.model.Location;
import com.tide.service.TideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    @Autowired
    private TideService tideService;

    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        return ResponseEntity.ok(tideService.getAllLocations());
    }

    @PostMapping
    public ResponseEntity<Location> createLocation(@RequestBody LocationRequest request) {
        Location location = tideService.getOrCreateLocation(
                request.getName(),
                request.getLatitude(),
                request.getLongitude()
        );
        return ResponseEntity.ok(location);
    }

    public static class LocationRequest {
        private String name;
        private Double latitude;
        private Double longitude;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }
    }
}
