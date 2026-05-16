package com.hospital.service;

import com.hospital.entity.Nurse;
import com.hospital.repository.NurseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NurseService {
    @Autowired
    private NurseRepository nurseRepository;

    public List<Nurse> getAllNurses() {
        return nurseRepository.findAll();
    }

    public Optional<Nurse> getNurseById(Long id) {
        return nurseRepository.findById(id);
    }

    public Nurse createNurse(Nurse nurse) {
        return nurseRepository.save(nurse);
    }

    public Nurse updateNurse(Long id, Nurse nurseDetails) {
        return nurseRepository.findById(id).map(nurse -> {
            nurse.setName(nurseDetails.getName());
            nurse.setEmployeeId(nurseDetails.getEmployeeId());
            nurse.setIcuQualified(nurseDetails.isIcuQualified());
            return nurseRepository.save(nurse);
        }).orElseThrow(() -> new RuntimeException("Nurse not found"));
    }

    public void deleteNurse(Long id) {
        nurseRepository.deleteById(id);
    }

    public List<Nurse> getIcuQualifiedNurses() {
        return nurseRepository.findByIsIcuQualifiedTrue();
    }
}
