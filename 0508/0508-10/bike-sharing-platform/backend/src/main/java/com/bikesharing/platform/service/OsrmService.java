package com.bikesharing.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OsrmService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    private static final String OSRM_BASE_URL = "https://router.project-osrm.org";
    private static final String DEMO_BASE_URL = "http://router.project-osrm.org";

    public static class DistanceResult {
        public final double distanceKm;
        public final int durationMinutes;
        public final List<double[]> coordinates;

        public DistanceResult(double distanceKm, int durationMinutes, List<double[]> coordinates) {
            this.distanceKm = distanceKm;
            this.durationMinutes = durationMinutes;
            this.coordinates = coordinates;
        }
    }

    public DistanceResult getRouteDistance(double fromLat, double fromLon, 
                                            double toLat, double toLon) {
        try {
            String url = String.format("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
                    DEMO_BASE_URL, fromLon, fromLat, toLon, toLat);
            
            log.debug("Calling OSRM: {}", url);
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null) {
                return calculateFallbackDistance(fromLat, fromLon, toLat, toLon);
            }
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode routes = root.path("routes");
            
            if (routes.isArray() && routes.size() > 0) {
                JsonNode route = routes.get(0);
                double distanceMeters = route.path("distance").asDouble();
                double durationSeconds = route.path("duration").asDouble();
                
                List<double[]> coords = new ArrayList<>();
                JsonNode geometry = route.path("geometry").path("coordinates");
                if (geometry.isArray()) {
                    for (JsonNode coord : geometry) {
                        double lon = coord.get(0).asDouble();
                        double lat = coord.get(1).asDouble();
                        coords.add(new double[]{lat, lon});
                    }
                }
                
                return new DistanceResult(
                    distanceMeters / 1000.0,
                    (int) Math.ceil(durationSeconds / 60.0),
                    coords
                );
            }
            
            return calculateFallbackDistance(fromLat, fromLon, toLat, toLon);
            
        } catch (Exception e) {
            log.warn("OSRM API call failed, using fallback distance: {}", e.getMessage());
            return calculateFallbackDistance(fromLat, fromLon, toLat, toLon);
        }
    }

    private DistanceResult calculateFallbackDistance(double lat1, double lon1, 
                                                      double lat2, double lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceKm = R * c;
        
        int durationMinutes = (int) Math.ceil(distanceKm * 3.5);
        
        List<double[]> coords = new ArrayList<>();
        coords.add(new double[]{lat1, lon1});
        coords.add(new double[]{lat2, lon2});
        
        return new DistanceResult(distanceKm, durationMinutes, coords);
    }

    public double[][] getDistanceMatrix(List<double[]> points) {
        int n = points.size();
        double[][] matrix = new double[n][n];
        
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    matrix[i][j] = 0;
                } else {
                    DistanceResult result = getRouteDistance(
                        points.get(i)[0], points.get(i)[1],
                        points.get(j)[0], points.get(j)[1]
                    );
                    matrix[i][j] = result.distanceKm;
                }
            }
        }
        
        return matrix;
    }
}
