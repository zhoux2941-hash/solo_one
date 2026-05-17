package com.oceanheritage.controller;

import com.oceanheritage.entity.Ship;
import com.oceanheritage.service.ShipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ships")
public class ShipController {

    @Autowired
    private ShipService shipService;

    @GetMapping
    public List<Ship> getAllShips() {
        return shipService.getAllShips();
    }

    @GetMapping("/{mmsi}")
    public ResponseEntity<Ship> getShipByMmsi(@PathVariable String mmsi) {
        Optional<Ship> ship = shipService.getShipByMmsi(mmsi);
        return ship.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/report")
    public Ship reportAIS(@RequestBody Map<String, Object> aisData) {
        String mmsi = (String) aisData.get("mmsi");
        String name = (String) aisData.get("name");
        Double lng = ((Number) aisData.get("lng")).doubleValue();
        Double lat = ((Number) aisData.get("lat")).doubleValue();
        Double speed = aisData.containsKey("speed") ? ((Number) aisData.get("speed")).doubleValue() : 0.0;
        Double heading = aisData.containsKey("heading") ? ((Number) aisData.get("heading")).doubleValue() : 0.0;
        
        return shipService.processAISReport(mmsi, name, lng, lat, speed, heading);
    }

    @PostMapping
    public Ship createShip(@RequestBody Ship ship) {
        return shipService.saveShip(ship);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShip(@PathVariable Long id) {
        shipService.deleteShip(id);
        return ResponseEntity.ok().build();
    }
}
