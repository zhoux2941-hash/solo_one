package com.oceanheritage.service;

import com.oceanheritage.entity.Alert;
import com.oceanheritage.entity.ProtectedArea;
import com.oceanheritage.entity.Ship;
import com.oceanheritage.repository.AlertRepository;
import com.oceanheritage.repository.ShipRepository;
import com.alibaba.fastjson.JSON;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ShipService {

    @Autowired
    private ShipRepository shipRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired
    private WebSocketService webSocketService;

    @Transactional
    public Ship processAISReport(String mmsi, String name, double lng, double lat, double speed, double heading) {
        Ship ship = shipRepository.findByMmsi(mmsi).orElse(new Ship());
        ship.setMmsi(mmsi);
        ship.setName(name);
        ship.setCurrentLng(lng);
        ship.setCurrentLat(lat);
        ship.setSpeed(speed);
        ship.setHeading(heading);
        ship.setLastReportTime(System.currentTimeMillis());

        boolean wasInside = ship.getIsInsideArea() != null && ship.getIsInsideArea();
        boolean isInsideNow = false;
        ProtectedArea enteredArea = null;

        List<ProtectedArea> areas = geofenceService.getAllEnabledAreas();
        for (ProtectedArea area : areas) {
            if (geofenceService.isPointInPolygon(lng, lat, area)) {
                isInsideNow = true;
                enteredArea = area;
                break;
            }
        }

        ship.setIsInsideArea(isInsideNow);
        ship = shipRepository.save(ship);

        if (!wasInside && isInsideNow && enteredArea != null) {
            createAlert(ship, enteredArea, Alert.AlertType.ENTERING);
        }

        Map<String, Object> shipData = new HashMap<>();
        shipData.put("mmsi", ship.getMmsi());
        shipData.put("name", ship.getName());
        shipData.put("lng", ship.getCurrentLng());
        shipData.put("lat", ship.getCurrentLat());
        shipData.put("speed", ship.getSpeed());
        shipData.put("heading", ship.getHeading());
        shipData.put("isInsideArea", ship.getIsInsideArea());
        shipData.put("timestamp", ship.getLastReportTime());

        webSocketService.broadcast("ship_update", JSON.toJSONString(shipData));

        return ship;
    }

    private void createAlert(Ship ship, ProtectedArea area, Alert.AlertType type) {
        Alert alert = new Alert();
        alert.setShipMmsi(ship.getMmsi());
        alert.setShipName(ship.getName());
        alert.setAreaId(area.getId());
        alert.setAreaName(area.getName());
        alert.setLng(ship.getCurrentLng());
        alert.setLat(ship.getCurrentLat());
        alert.setSpeed(ship.getSpeed());
        alert.setType(type);

        Map<String, Object> evidence = new HashMap<>();
        evidence.put("position", ship.getCurrentLng() + "," + ship.getCurrentLat());
        evidence.put("speed", ship.getSpeed());
        evidence.put("heading", ship.getHeading());
        evidence.put("area", area.getName());
        evidence.put("timestamp", System.currentTimeMillis());
        alert.setEvidence(JSON.toJSONString(evidence));

        alert = alertRepository.save(alert);

        Map<String, Object> alertData = new HashMap<>();
        alertData.put("id", alert.getId());
        alertData.put("shipMmsi", alert.getShipMmsi());
        alertData.put("shipName", alert.getShipName());
        alertData.put("areaName", alert.getAreaName());
        alertData.put("lng", alert.getLng());
        alertData.put("lat", alert.getLat());
        alertData.put("speed", alert.getSpeed());
        alertData.put("type", alert.getType() != null ? alert.getType().name() : "ENTERING");
        alertData.put("status", alert.getStatus() != null ? alert.getStatus().name() : "ACTIVE");
        alertData.put("alertTime", alert.getAlertTime());
        alertData.put("timestamp", alert.getAlertTime());

        webSocketService.broadcast("alert", JSON.toJSONString(alertData));
    }

    public List<Ship> getAllShips() {
        return shipRepository.findAll();
    }

    public Optional<Ship> getShipByMmsi(String mmsi) {
        return shipRepository.findByMmsi(mmsi);
    }

    public Ship saveShip(Ship ship) {
        return shipRepository.save(ship);
    }

    public void deleteShip(Long id) {
        shipRepository.deleteById(id);
    }
}
