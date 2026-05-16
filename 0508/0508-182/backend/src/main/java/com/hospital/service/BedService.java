package com.hospital.service;

import com.hospital.entity.Bed;
import com.hospital.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BedService {
    @Autowired
    private BedRepository bedRepository;

    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    public Optional<Bed> getBedById(Long id) {
        return bedRepository.findById(id);
    }

    public Bed createBed(Bed bed) {
        bed.setStatus(Bed.BedStatus.AVAILABLE);
        return bedRepository.save(bed);
    }

    public Bed updateBed(Long id, Bed bedDetails) {
        return bedRepository.findById(id).map(bed -> {
            bed.setBedNumber(bedDetails.getBedNumber());
            bed.setType(bedDetails.getType());
            return bedRepository.save(bed);
        }).orElseThrow(() -> new RuntimeException("Bed not found"));
    }

    public Bed assignPatient(Long id, String patientName, String patientId) {
        return bedRepository.findById(id).map(bed -> {
            bed.setPatientName(patientName);
            bed.setPatientId(patientId);
            bed.setStatus(Bed.BedStatus.OCCUPIED);
            return bedRepository.save(bed);
        }).orElseThrow(() -> new RuntimeException("Bed not found"));
    }

    public Bed releaseBed(Long id) {
        return bedRepository.findById(id).map(bed -> {
            bed.setPatientName(null);
            bed.setPatientId(null);
            bed.setStatus(Bed.BedStatus.AVAILABLE);
            return bedRepository.save(bed);
        }).orElseThrow(() -> new RuntimeException("Bed not found"));
    }

    public void deleteBed(Long id) {
        bedRepository.deleteById(id);
    }

    public long getOccupiedIcuBedCount() {
        return bedRepository.countOccupiedIcuBeds();
    }
}
