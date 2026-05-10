package com.tide.service;

import com.tide.model.Location;
import com.tide.model.MoonPhase;
import com.tide.model.TideRecord;
import com.tide.repository.LocationRepository;
import com.tide.repository.TideRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TideService {

    private static final String UPLOAD_DIR = "uploads/tide-photos";

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private TideRecordRepository tideRecordRepository;

    @Autowired
    private TideCalculationService tideCalculationService;

    @Autowired
    private MoonPhaseService moonPhaseService;

    @Autowired
    private TideCacheService tideCacheService;

    @Transactional
    public Location getOrCreateLocation(String name, Double latitude, Double longitude) {
        return locationRepository.findByLatitudeAndLongitude(latitude, longitude)
                .orElseGet(() -> {
                    Location location = Location.builder()
                            .name(name != null ? name : "观测点 " + latitude + ", " + longitude)
                            .latitude(latitude)
                            .longitude(longitude)
                            .build();
                    return locationRepository.save(location);
                });
    }

    @Transactional(readOnly = true)
    public List<TideRecord> getDailyTideTable(Long locationId, LocalDate date) {
        List<TideRecord> cached = tideCacheService.getCachedDailyTideTable(locationId, date);
        if (cached != null) {
            return mergeWithActualRecords(cached, locationId, date);
        }

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        List<TideRecord> theoretical = tideCalculationService.generateDailyTideTable(location, date);
        tideCacheService.cacheDailyTideTable(locationId, date, theoretical);

        return mergeWithActualRecords(theoretical, locationId, date);
    }

    @Transactional(readOnly = true)
    public List<TideRecord> getMonthlyTideTable(Long locationId, int year, int month) {
        List<TideRecord> cached = tideCacheService.getCachedMonthlyTideTable(locationId, year, month);
        if (cached != null) {
            return cached;
        }

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        List<TideRecord> theoretical = tideCalculationService.generateMonthlyTideTable(location, year, month);
        tideCacheService.cacheMonthlyTideTable(locationId, year, month, theoretical);

        return theoretical;
    }

    @Transactional
    public TideRecord recordActualTide(Long locationId, LocalDateTime time, Double actualHeight, 
                                        MultipartFile photo, String notes) throws IOException {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        MoonPhase moonPhase = moonPhaseService.calculateMoonPhase(time.toLocalDate());
        double theoreticalHeight = tideCalculationService.calculateTheoreticalHeight(location, time, moonPhase);

        TideRecord record = TideRecord.builder()
                .location(location)
                .recordTime(time)
                .theoreticalHeight(theoreticalHeight)
                .actualHeight(actualHeight)
                .notes(notes)
                .build();

        if (photo != null && !photo.isEmpty()) {
            String photoPath = savePhoto(photo);
            record.setPhotoPath(photoPath);
        }

        tideRecordRepository.save(record);
        tideCacheService.invalidateLocationCache(locationId);

        return record;
    }

    @Transactional(readOnly = true)
    public MoonPhase getMoonPhase(LocalDate date) {
        return moonPhaseService.calculateMoonPhase(date);
    }

    @Transactional(readOnly = true)
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    @Transactional
    public TideRecord updateActualTide(Long recordId, Double actualHeight, MultipartFile photo, String notes) throws IOException {
        TideRecord record = tideRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (actualHeight != null) {
            record.setActualHeight(actualHeight);
        }
        if (notes != null) {
            record.setNotes(notes);
        }
        if (photo != null && !photo.isEmpty()) {
            if (record.getPhotoPath() != null) {
                deletePhoto(record.getPhotoPath());
            }
            String photoPath = savePhoto(photo);
            record.setPhotoPath(photoPath);
        }

        tideRecordRepository.save(record);
        tideCacheService.invalidateLocationCache(record.getLocation().getId());

        return record;
    }

    private List<TideRecord> mergeWithActualRecords(List<TideRecord> theoretical, Long locationId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        
        List<TideRecord> actualRecords = tideRecordRepository.findByLocationIdAndTimeRange(locationId, start, end);
        
        for (TideRecord actual : actualRecords) {
            TideRecord closestTheoretical = findClosestTheoreticalRecord(theoretical, actual.getRecordTime());
            
            if (closestTheoretical != null) {
                closestTheoretical.setActualHeight(actual.getActualHeight());
                closestTheoretical.setPhotoPath(actual.getPhotoPath());
                closestTheoretical.setNotes(actual.getNotes());
                closestTheoretical.setId(actual.getId());
            }
        }
        
        return theoretical;
    }
    
    private TideRecord findClosestTheoreticalRecord(List<TideRecord> theoretical, LocalDateTime actualTime) {
        if (theoretical == null || theoretical.isEmpty()) {
            return null;
        }
        
        TideRecord closest = null;
        long minMinutesDiff = 16;
        
        for (TideRecord record : theoretical) {
            long diffMinutes = Math.abs(
                java.time.Duration.between(record.getRecordTime(), actualTime).toMinutes()
            );
            
            if (diffMinutes < minMinutesDiff) {
                minMinutesDiff = diffMinutes;
                closest = record;
            }
        }
        
        return minMinutesDiff <= 15 ? closest : null;
    }

    private String savePhoto(MultipartFile photo) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = photo.getOriginalFilename();
        String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);
        
        Files.copy(photo.getInputStream(), filePath);
        return filePath.toString();
    }

    private void deletePhoto(String photoPath) throws IOException {
        Path path = Paths.get(photoPath);
        if (Files.exists(path)) {
            Files.delete(path);
        }
    }
}
