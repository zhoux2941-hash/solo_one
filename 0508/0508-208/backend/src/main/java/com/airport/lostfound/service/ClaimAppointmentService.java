package com.airport.lostfound.service;

import com.airport.lostfound.model.ClaimAppointment;
import com.airport.lostfound.model.FoundItem;
import com.airport.lostfound.repository.ClaimAppointmentRepository;
import com.airport.lostfound.repository.FoundItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClaimAppointmentService {

    @Autowired
    private ClaimAppointmentRepository claimAppointmentRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    public ClaimAppointment save(ClaimAppointment appointment) {
        List<ClaimAppointment> existingAppointments = claimAppointmentRepository.findByFoundItemId(appointment.getFoundItemId());
        
        for (ClaimAppointment existing : existingAppointments) {
            if ("待核验".equals(existing.getStatus()) || "已完成".equals(existing.getStatus())) {
                throw new IllegalStateException("该物品已被预约或已认领，无法重复预约");
            }
        }
        
        return claimAppointmentRepository.save(appointment);
    }

    public List<ClaimAppointment> findAll() {
        return claimAppointmentRepository.findAll();
    }

    public Optional<ClaimAppointment> findById(Long id) {
        return claimAppointmentRepository.findById(id);
    }

    public List<ClaimAppointment> findByStatus(String status) {
        return claimAppointmentRepository.findByStatus(status);
    }

    public ClaimAppointment updateStatus(Long id, String status) {
        Optional<ClaimAppointment> optional = claimAppointmentRepository.findById(id);
        if (optional.isPresent()) {
            ClaimAppointment appointment = optional.get();
            appointment.setStatus(status);
            
            if ("已完成".equals(status)) {
                Optional<FoundItem> optionalItem = foundItemRepository.findById(appointment.getFoundItemId());
                if (optionalItem.isPresent()) {
                    FoundItem item = optionalItem.get();
                    item.setStatus("已认领");
                    foundItemRepository.save(item);
                }
            }
            
            return claimAppointmentRepository.save(appointment);
        }
        return null;
    }
}
