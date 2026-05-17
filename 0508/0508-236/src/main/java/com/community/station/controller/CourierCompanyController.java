package com.community.station.controller;

import com.community.station.entity.CourierCompany;
import com.community.station.service.CourierCompanyService;
import com.community.station.util.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courier-companies")
@CrossOrigin(origins = "*")
public class CourierCompanyController {

    @Autowired
    private CourierCompanyService courierCompanyService;

    @GetMapping
    public List<CourierCompany> getAllCourierCompanies() {
        return courierCompanyService.getAllCourierCompanies();
    }

    @GetMapping("/page")
    public PageResult<CourierCompany> getCourierCompaniesByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<CourierCompany> companyPage = courierCompanyService.getCourierCompaniesByPage(page, size);
        return new PageResult<>(companyPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourierCompany> getCourierCompanyById(@PathVariable Long id) {
        return courierCompanyService.getCourierCompanyById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createCourierCompany(@RequestBody CourierCompany courierCompany) {
        try {
            CourierCompany createdCompany = courierCompanyService.createCourierCompany(courierCompany);
            return ResponseEntity.ok(createdCompany);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourierCompany(@PathVariable Long id, @RequestBody CourierCompany courierCompanyDetails) {
        try {
            CourierCompany updatedCompany = courierCompanyService.updateCourierCompany(id, courierCompanyDetails);
            return ResponseEntity.ok(updatedCompany);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourierCompany(@PathVariable Long id) {
        courierCompanyService.deleteCourierCompany(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<CourierCompany> toggleCourierCompanyStatus(@PathVariable Long id) {
        try {
            CourierCompany courierCompany = courierCompanyService.toggleCourierCompanyStatus(id);
            return ResponseEntity.ok(courierCompany);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
