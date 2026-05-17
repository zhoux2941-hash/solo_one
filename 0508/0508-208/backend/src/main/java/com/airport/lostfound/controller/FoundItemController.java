package com.airport.lostfound.controller;

import com.airport.lostfound.model.FoundItem;
import com.airport.lostfound.service.FoundItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/found-items")
@CrossOrigin(origins = "*")
public class FoundItemController {

    @Autowired
    private FoundItemService foundItemService;

    @PostMapping
    public ResponseEntity<FoundItem> create(@Valid @RequestBody FoundItem foundItem) {
        FoundItem saved = foundItemService.save(foundItem);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<FoundItem>> findAll() {
        return ResponseEntity.ok(foundItemService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoundItem> findById(@PathVariable Long id) {
        Optional<FoundItem> optional = foundItemService.findById(id);
        return optional.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<FoundItem>> findByStatus(@PathVariable String status) {
        return ResponseEntity.ok(foundItemService.findByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FoundItem> updateStatus(@PathVariable Long id, @RequestParam String status) {
        FoundItem updated = foundItemService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
