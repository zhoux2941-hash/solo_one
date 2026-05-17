package com.oceanheritage.simulator;

import com.oceanheritage.service.ShipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class AisSimulator {

    @Autowired
    private ShipService shipService;

    private List<SimulatedShip> simulatedShips = new ArrayList<>();
    private Random random = new Random();

    @PostConstruct
    public void init() {
        simulatedShips.add(new SimulatedShip("413123456", "远洋号", 121.8, 31.2, 15.5, 45.0));
        simulatedShips.add(new SimulatedShip("413123457", "清风号", 121.9, 31.1, 12.0, 90.0));
        simulatedShips.add(new SimulatedShip("413123458", "碧海号", 122.0, 31.0, 18.0, 180.0));
        simulatedShips.add(new SimulatedShip("413123459", "远航号", 121.7, 31.3, 8.5, 270.0));
        simulatedShips.add(new SimulatedShip("413123460", "明珠号", 121.85, 31.15, 20.0, 30.0));
    }

    @Scheduled(fixedRate = 30000)
    public void simulateAISReports() {
        for (SimulatedShip ship : simulatedShips) {
            updateShipPosition(ship);
            shipService.processAISReport(
                ship.mmsi,
                ship.name,
                ship.lng,
                ship.lat,
                ship.speed,
                ship.heading
            );
        }
    }

    private void updateShipPosition(SimulatedShip ship) {
        double latRadians = Math.toRadians(ship.lat);
        double metersPerDegreeLng = 111319.9 * Math.cos(latRadians);
        double metersPerDegreeLat = 110574.3;

        double speedMetersPerSecond = ship.speed * 0.51444;
        double timeSeconds = 30;
        double distanceMeters = speedMetersPerSecond * timeSeconds;

        double headingRadians = Math.toRadians(ship.heading);
        double deltaLat = (distanceMeters * Math.cos(headingRadians)) / metersPerDegreeLat;
        double deltaLng = (distanceMeters * Math.sin(headingRadians)) / metersPerDegreeLng;

        ship.lat += deltaLat;
        ship.lng += deltaLng;

        ship.heading += (random.nextDouble() - 0.5) * 10;
        if (ship.heading < 0) ship.heading += 360;
        if (ship.heading >= 360) ship.heading -= 360;

        ship.speed += (random.nextDouble() - 0.5) * 2;
        ship.speed = Math.max(0, Math.min(30, ship.speed));

        if (ship.lng < 121.0 || ship.lng > 123.0 || ship.lat < 30.0 || ship.lat > 32.0) {
            ship.heading = (ship.heading + 180) % 360;
        }
    }

    private static class SimulatedShip {
        String mmsi;
        String name;
        double lng;
        double lat;
        double speed;
        double heading;

        SimulatedShip(String mmsi, String name, double lng, double lat, double speed, double heading) {
            this.mmsi = mmsi;
            this.name = name;
            this.lng = lng;
            this.lat = lat;
            this.speed = speed;
            this.heading = heading;
        }
    }
}
