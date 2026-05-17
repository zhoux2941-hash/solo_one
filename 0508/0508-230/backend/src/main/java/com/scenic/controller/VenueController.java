package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Venue;
import com.scenic.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/venue")
public class VenueController {

    @Autowired
    private VenueService venueService;

    @GetMapping("/{id}")
    public Result<Venue> getById(@PathVariable Long id) {
        return venueService.findById(id)
                .map(Result::success)
                .orElse(Result.error("场地不存在"));
    }

    @GetMapping("/code/{venueCode}")
    public Result<Venue> getByVenueCode(@PathVariable String venueCode) {
        return venueService.findByVenueCode(venueCode)
                .map(Result::success)
                .orElse(Result.error("场地不存在"));
    }

    @GetMapping("/page")
    public Result<Page<Venue>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String venueType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        return Result.success(venueService.findByPage(keyword, status, venueType, pageable));
    }

    @GetMapping("/list")
    public Result<List<Venue>> list(@RequestParam(required = false) String status) {
        return Result.success(venueService.findByStatus(status));
    }

    @PostMapping
    public Result<Venue> create(@RequestBody Map<String, Object> request) {
        Venue venue = new Venue();
        venue.setVenueCode((String) request.get("venueCode"));
        venue.setVenueName((String) request.get("venueName"));
        venue.setVenueType((String) request.get("venueType"));
        venue.setDescription((String) request.get("description"));
        venue.setLocation((String) request.get("location"));
        venue.setCapacity(request.get("capacity") != null ? Integer.valueOf(request.get("capacity").toString()) : null);
        venue.setHourlyRate(request.get("hourlyRate") != null ? new java.math.BigDecimal(request.get("hourlyRate").toString()) : null);
        venue.setDailyRate(request.get("dailyRate") != null ? new java.math.BigDecimal(request.get("dailyRate").toString()) : null);
        venue.setFacilities((String) request.get("facilities"));
        venue.setStatus((String) request.get("status"));
        venue.setRemark((String) request.get("remark"));

        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = venueService.createVenue(venue, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Venue) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PutMapping("/{id}")
    public Result<Venue> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Venue venue = new Venue();
        venue.setVenueName((String) request.get("venueName"));
        venue.setVenueType((String) request.get("venueType"));
        venue.setDescription((String) request.get("description"));
        venue.setLocation((String) request.get("location"));
        venue.setCapacity(request.get("capacity") != null ? Integer.valueOf(request.get("capacity").toString()) : null);
        venue.setHourlyRate(request.get("hourlyRate") != null ? new java.math.BigDecimal(request.get("hourlyRate").toString()) : null);
        venue.setDailyRate(request.get("dailyRate") != null ? new java.math.BigDecimal(request.get("dailyRate").toString()) : null);
        venue.setFacilities((String) request.get("facilities"));
        venue.setStatus((String) request.get("status"));
        venue.setRemark((String) request.get("remark"));

        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = venueService.updateVenue(id, venue, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Venue) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = venueService.deleteVenue(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(venueService.getStatistics());
    }
}
