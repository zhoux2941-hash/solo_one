package com.carpool.service;

import com.carpool.dto.TripDTO;
import com.carpool.entity.Trip;
import com.carpool.entity.User;
import com.carpool.repository.TripRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final UserService userService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_CITIES_KEY = "carpool:hot_cities:";
    private static final long CACHE_EXPIRE_MINUTES = 30;

    public TripService(TripRepository tripRepository, UserService userService,
                       RedisTemplate<String, Object> redisTemplate) {
        this.tripRepository = tripRepository;
        this.userService = userService;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public TripDTO.TripResponse createTrip(Long userId, TripDTO.CreateTripRequest request) {
        User publisher = userService.getUserById(userId);

        Trip trip = new Trip();
        trip.setPublisher(publisher);
        trip.setDepartureCity(request.getDepartureCity());
        trip.setDestinationCity(request.getDestinationCity());
        trip.setWaypoints(normalizeWaypoints(request.getWaypoints()));
        trip.setDepartureTime(request.getDepartureTime());
        trip.setTotalSeats(request.getTotalSeats());
        trip.setAvailableSeats(request.getTotalSeats());
        trip.setCostPerPerson(request.getCostPerPerson());
        trip.setDescription(request.getDescription());
        trip.setStatus("OPEN");

        Trip savedTrip = tripRepository.save(trip);
        evictHotCityCache(request.getDestinationCity());

        return convertToResponse(savedTrip);
    }

    private String normalizeWaypoints(String waypoints) {
        if (waypoints == null || waypoints.trim().isEmpty()) {
            return null;
        }
        return waypoints.trim();
    }

    public List<TripDTO.TripResponse> searchMatchingTrips(TripDTO.SearchTripRequest request) {
        LocalDateTime startTime = request.getDepartureTime().minusHours(1);
        LocalDateTime endTime = request.getDepartureTime().plusHours(1);
        String targetCity = request.getDestinationCity();

        updateCitySearchCount(targetCity);

        List<Trip> exactMatchTrips = tripRepository.findMatchingTrips(
            targetCity,
            startTime,
            endTime
        );
        exactMatchTrips.forEach(trip -> trip.setMatchType("EXACT"));

        List<Trip> waypointTrips = tripRepository.findOpenTripsInTimeRangeExcludingDestination(
            targetCity,
            startTime,
            endTime
        );

        List<Trip> waypointMatchTrips = waypointTrips.stream()
            .filter(trip -> trip.hasWaypoint(targetCity))
            .collect(Collectors.toList());
        waypointMatchTrips.forEach(trip -> trip.setMatchType("WAYPOINT"));

        Set<Long> seenIds = new HashSet<>();
        List<Trip> allTrips = new ArrayList<>();

        for (Trip trip : exactMatchTrips) {
            if (!seenIds.contains(trip.getId())) {
                seenIds.add(trip.getId());
                allTrips.add(trip);
            }
        }
        for (Trip trip : waypointMatchTrips) {
            if (!seenIds.contains(trip.getId())) {
                seenIds.add(trip.getId());
                allTrips.add(trip);
            }
        }

        return allTrips.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    public List<TripDTO.TripResponse> getMyTrips(Long userId) {
        return tripRepository.findByPublisherIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    public TripDTO.TripResponse getTripById(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new RuntimeException("行程不存在"));
        return convertToResponse(trip);
    }

    public List<TripDTO.HotCityTrip> getHotCityTrips() {
        String cacheKey = HOT_CITIES_KEY + "all";
        List<TripDTO.HotCityTrip> cached = (List<TripDTO.HotCityTrip>) redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            return cached;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Object[]> popularDestinations = tripRepository.findPopularDestinations(now);

        List<TripDTO.HotCityTrip> hotTrips = popularDestinations.stream()
            .limit(10)
            .map(row -> {
                String city = (String) row[0];
                Long count = (Long) row[1];

                List<Trip> cityTrips = tripRepository.findByDestinationCityAndStatusOpen(city, now);

                TripDTO.HotCityTrip hotCityTrip = new TripDTO.HotCityTrip();
                hotCityTrip.setCity(city);
                hotCityTrip.setTripCount(count);
                hotCityTrip.setTrips(cityTrips.stream()
                    .limit(5)
                    .map(this::convertToResponse)
                    .collect(Collectors.toList()));

                return hotCityTrip;
            })
            .collect(Collectors.toList());

        redisTemplate.opsForValue().set(cacheKey, hotTrips, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return hotTrips;
    }

    public List<TripDTO.TripResponse> getRecentTrips() {
        return tripRepository.findRecentOpenTrips(LocalDateTime.now())
            .stream()
            .limit(20)
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void updateTripStatus(Long tripId, String status) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new RuntimeException("行程不存在"));
        trip.setStatus(status);
        tripRepository.save(trip);
        evictHotCityCache(trip.getDestinationCity());
    }

    @Transactional
    public void decreaseAvailableSeats(Long tripId, int seats) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new RuntimeException("行程不存在"));

        if (trip.getAvailableSeats() < seats) {
            throw new RuntimeException("座位不足");
        }

        trip.setAvailableSeats(trip.getAvailableSeats() - seats);

        if (trip.getAvailableSeats() == 0) {
            trip.setStatus("FULL");
        }

        tripRepository.save(trip);
        evictHotCityCache(trip.getDestinationCity());
    }

    private void updateCitySearchCount(String city) {
        String key = HOT_CITIES_KEY + "search:" + city;
        redisTemplate.opsForValue().increment(key, 1);
        redisTemplate.expire(key, 24, TimeUnit.HOURS);
    }

    private void evictHotCityCache(String city) {
        redisTemplate.delete(HOT_CITIES_KEY + "all");
    }

    private TripDTO.TripResponse convertToResponse(Trip trip) {
        TripDTO.TripResponse response = new TripDTO.TripResponse();
        response.setId(trip.getId());
        response.setPublisherId(trip.getPublisher().getId());
        response.setPublisherName(trip.getPublisher().getRealName());
        response.setPublisherCreditScore(trip.getPublisher().getCreditScore());
        response.setDepartureCity(trip.getDepartureCity());
        response.setDestinationCity(trip.getDestinationCity());
        response.setWaypoints(trip.getWaypoints());
        response.setWaypointList(trip.getWaypointList());
        response.setMatchType(trip.getMatchType());
        response.setDepartureTime(trip.getDepartureTime());
        response.setTotalSeats(trip.getTotalSeats());
        response.setAvailableSeats(trip.getAvailableSeats());
        response.setCostPerPerson(trip.getCostPerPerson());
        response.setDescription(trip.getDescription());
        response.setStatus(trip.getStatus());
        response.setCreatedAt(trip.getCreatedAt());
        return response;
    }
}
