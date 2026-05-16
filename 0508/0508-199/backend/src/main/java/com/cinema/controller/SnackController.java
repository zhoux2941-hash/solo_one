package com.cinema.controller;

import com.cinema.entity.Snack;
import com.cinema.service.SnackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/snacks")
@CrossOrigin(origins = "*")
public class SnackController {
    
    @Autowired
    private SnackService snackService;
    
    @GetMapping
    public ResponseEntity<List<Snack>> getAllSnacks() {
        return ResponseEntity.ok(snackService.getAllSnacks());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Snack> getSnackById(@PathVariable Long id) {
        Snack snack = snackService.getSnackById(id);
        return snack != null ? ResponseEntity.ok(snack) : ResponseEntity.notFound().build();
    }
}