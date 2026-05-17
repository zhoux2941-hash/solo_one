package com.oceanheritage.service;

import com.oceanheritage.entity.Coordinate;
import com.oceanheritage.entity.ProtectedArea;
import com.oceanheritage.repository.ProtectedAreaRepository;
import org.locationtech.jts.geom.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GeofenceService {

    @Autowired
    private ProtectedAreaRepository protectedAreaRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    public boolean isPointInPolygon(double lng, double lat, ProtectedArea area) {
        List<Coordinate> coordinates = area.getCoordinates();
        if (coordinates == null || coordinates.size() < 3) {
            return false;
        }

        List<org.locationtech.jts.geom.Coordinate> jtsCoordList = new ArrayList<>();
        for (Coordinate coord : coordinates) {
            jtsCoordList.add(new org.locationtech.jts.geom.Coordinate(coord.getLng(), coord.getLat()));
        }

        Coordinate firstCoord = coordinates.get(0);
        Coordinate lastCoord = coordinates.get(coordinates.size() - 1);
        if (firstCoord.getLng() != lastCoord.getLng() || firstCoord.getLat() != lastCoord.getLat()) {
            jtsCoordList.add(new org.locationtech.jts.geom.Coordinate(firstCoord.getLng(), firstCoord.getLat()));
        }

        org.locationtech.jts.geom.Coordinate[] jtsCoords = jtsCoordList.toArray(new org.locationtech.jts.geom.Coordinate[0]);
        LinearRing ring = geometryFactory.createLinearRing(jtsCoords);
        Polygon polygon = geometryFactory.createPolygon(ring);
        Point point = geometryFactory.createPoint(new org.locationtech.jts.geom.Coordinate(lng, lat));

        return polygon.contains(point);
    }

    public double calculateDistanceToArea(double lng, double lat, ProtectedArea area) {
        List<Coordinate> coordinates = area.getCoordinates();
        if (coordinates == null || coordinates.size() < 3) {
            return Double.MAX_VALUE;
        }

        org.locationtech.jts.geom.Coordinate[] jtsCoords = new org.locationtech.jts.geom.Coordinate[coordinates.size()];
        for (int i = 0; i < coordinates.size(); i++) {
            jtsCoords[i] = new org.locationtech.jts.geom.Coordinate(
                coordinates.get(i).getLng(),
                coordinates.get(i).getLat()
            );
        }

        LinearRing ring = geometryFactory.createLinearRing(jtsCoords);
        Polygon polygon = geometryFactory.createPolygon(ring);
        Point point = geometryFactory.createPoint(new org.locationtech.jts.geom.Coordinate(lng, lat));

        double distanceDegrees = polygon.distance(point);
        return convertDegreesToMeters(distanceDegrees, lat);
    }

    private double convertDegreesToMeters(double degrees, double latitude) {
        double latRadians = Math.toRadians(latitude);
        double metersPerDegreeLng = 111319.9 * Math.cos(latRadians);
        double metersPerDegreeLat = 110574.3;
        double avgMetersPerDegree = (metersPerDegreeLng + metersPerDegreeLat) / 2;
        return degrees * avgMetersPerDegree;
    }

    public List<ProtectedArea> getAllEnabledAreas() {
        return protectedAreaRepository.findByEnabledTrue();
    }

    public ProtectedArea saveArea(ProtectedArea area) {
        area.setUpdateTime(System.currentTimeMillis());
        return protectedAreaRepository.save(area);
    }

    public Optional<ProtectedArea> getAreaById(Long id) {
        return protectedAreaRepository.findById(id);
    }

    public void deleteArea(Long id) {
        protectedAreaRepository.deleteById(id);
    }

    public List<ProtectedArea> getAllAreas() {
        return protectedAreaRepository.findAll();
    }
}
