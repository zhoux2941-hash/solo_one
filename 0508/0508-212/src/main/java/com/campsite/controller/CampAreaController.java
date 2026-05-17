package com.campsite.controller;

import com.campsite.entity.CampArea;
import com.campsite.service.CampAreaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/areas")
public class CampAreaController {

    @Autowired
    private CampAreaService campAreaService;

    @GetMapping
    public List<CampArea> getAllAreas() {
        return campAreaService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getAreasByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        Page<CampArea> pageResult;
        if (type != null && !type.isEmpty()) {
            pageResult = campAreaService.findByAreaType(type, page, size);
        } else if (status != null && !status.isEmpty()) {
            pageResult = campAreaService.findByStatus(status, page, size);
        } else {
            pageResult = campAreaService.findAll(page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("currentPage", pageResult.getNumber());
        response.put("pageSize", pageResult.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampArea> getAreaById(@PathVariable Long id) {
        Optional<CampArea> area = campAreaService.findById(id);
        return area.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{areaType}")
    public List<CampArea> getAreasByType(@PathVariable String areaType) {
        return campAreaService.findByAreaType(areaType);
    }

    @GetMapping("/status/{status}")
    public List<CampArea> getAreasByStatus(@PathVariable String status) {
        return campAreaService.findByStatus(status);
    }

    @PostMapping
    public CampArea createArea(@RequestBody CampArea campArea) {
        return campAreaService.save(campArea);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampArea> updateArea(@PathVariable Long id, @RequestBody CampArea campArea) {
        CampArea updated = campAreaService.update(id, campArea);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long id) {
        campAreaService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
