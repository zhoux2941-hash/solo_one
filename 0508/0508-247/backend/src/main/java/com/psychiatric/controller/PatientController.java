package com.psychiatric.controller;

import com.psychiatric.entity.Patient;
import com.psychiatric.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {
    
    @Autowired
    private PatientService patientService;
    
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }
    
    @GetMapping("/{braceletId}")
    public ResponseEntity<Patient> getPatientByBraceletId(@PathVariable String braceletId) {
        return patientService.getPatientByBraceletId(braceletId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {
        return patientService.savePatient(patient);
    }
    
    @PostMapping("/{braceletId}/location")
    public ResponseEntity<Patient> updateLocation(@PathVariable String braceletId,
                                                   @RequestBody Map<String, String> request) {
        String location = request.get("location");
        Patient patient = patientService.updateLocation(braceletId, location);
        return patient != null ? ResponseEntity.ok(patient) : ResponseEntity.notFound().build();
    }
}
