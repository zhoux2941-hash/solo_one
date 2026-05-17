package com.psychiatric.service;

import com.psychiatric.entity.Patient;
import com.psychiatric.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {
    
    @Autowired
    private PatientRepository patientRepository;
    
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
    
    public Optional<Patient> getPatientByBraceletId(String braceletId) {
        return patientRepository.findByBraceletId(braceletId);
    }
    
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }
    
    public Patient updateLocation(String braceletId, String location) {
        Optional<Patient> patientOpt = patientRepository.findByBraceletId(braceletId);
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            patient.setCurrentLocation(location);
            return patientRepository.save(patient);
        }
        return null;
    }
}
