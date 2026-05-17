package com.prison.call.controller;

import com.prison.call.entity.Inmate;
import com.prison.call.service.InmateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inmates")
@CrossOrigin(origins = "*")
public class InmateController {
    
    @Autowired
    private InmateService inmateService;
    
    @GetMapping
    public ResponseEntity<List<Inmate>> getAllInmates() {
        return ResponseEntity.ok(inmateService.getAllInmates());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Inmate> getInmateById(@PathVariable Long id) {
        return inmateService.getInmateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/no/{inmateNo}")
    public ResponseEntity<Inmate> getInmateByNo(@PathVariable String inmateNo) {
        return inmateService.getInmateByNo(inmateNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Inmate> createInmate(@RequestBody Inmate inmate) {
        return ResponseEntity.ok(inmateService.saveInmate(inmate));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Inmate> updateInmate(@PathVariable Long id, @RequestBody Inmate inmate) {
        inmate.setId(id);
        return ResponseEntity.ok(inmateService.saveInmate(inmate));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInmate(@PathVariable Long id) {
        inmateService.deleteInmate(id);
        return ResponseEntity.ok().build();
    }
}
