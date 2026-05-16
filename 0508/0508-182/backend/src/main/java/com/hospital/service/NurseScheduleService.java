package com.hospital.service;

import com.hospital.entity.Nurse;
import com.hospital.entity.NurseSchedule;
import com.hospital.entity.ScheduleSwapRequest;
import com.hospital.repository.NurseRepository;
import com.hospital.repository.NurseScheduleRepository;
import com.hospital.repository.ScheduleSwapRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class NurseScheduleService {
    @Autowired
    private NurseScheduleRepository scheduleRepository;

    @Autowired
    private NurseRepository nurseRepository;

    @Autowired
    private ScheduleSwapRequestRepository swapRequestRepository;

    @Autowired
    private ScheduleValidationService validationService;

    public List<NurseSchedule> getSchedulesByDateRange(LocalDate start, LocalDate end) {
        return scheduleRepository.findByScheduleDateBetween(start, end);
    }

    public Optional<NurseSchedule> getScheduleById(Long id) {
        return scheduleRepository.findById(id);
    }

    public NurseSchedule createSchedule(NurseSchedule schedule) {
        if (schedule.getNurse() == null || schedule.getNurse().getId() == null) {
            throw new RuntimeException("请选择护士");
        }
        
        Long nurseId = schedule.getNurse().getId();
        if (!validationService.canScheduleNurse(nurseId, schedule.getScheduleDate())) {
            throw new RuntimeException("护士每周排班不能超过5天");
        }
        
        Nurse nurse = nurseRepository.findById(nurseId)
            .orElseThrow(() -> new RuntimeException("护士不存在"));
        schedule.setNurse(nurse);
        schedule.setStatus(NurseSchedule.ScheduleStatus.CONFIRMED);
        
        NurseSchedule saved = scheduleRepository.save(schedule);
        
        ScheduleValidationService.ValidationResult validation = 
            validationService.validateIcuNurseCoverage(schedule.getScheduleDate());
        if (!validation.isValid()) {
            System.out.println("警告: ICU护士人力不足! 病人数: " + validation.getOccupiedIcuBeds() + 
                ", 护士数: " + validation.getIcuNursesOnDuty() + 
                ", 需要: " + validation.getRequiredNurses());
        }
        
        return saved;
    }

    public NurseSchedule updateSchedule(Long id, NurseSchedule scheduleDetails) {
        return scheduleRepository.findById(id).map(schedule -> {
            schedule.setScheduleDate(scheduleDetails.getScheduleDate());
            schedule.setShift(scheduleDetails.getShift());
            return scheduleRepository.save(schedule);
        }).orElseThrow(() -> new RuntimeException("Schedule not found"));
    }

    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }

    public ScheduleSwapRequest requestSwap(Long fromScheduleId, Long toScheduleId) {
        NurseSchedule fromSchedule = scheduleRepository.findById(fromScheduleId)
            .orElseThrow(() -> new RuntimeException("From schedule not found"));
        NurseSchedule toSchedule = scheduleRepository.findById(toScheduleId)
            .orElseThrow(() -> new RuntimeException("To schedule not found"));

        ScheduleSwapRequest request = new ScheduleSwapRequest();
        request.setFromSchedule(fromSchedule);
        request.setToSchedule(toSchedule);
        request.setStatus(ScheduleSwapRequest.SwapStatus.PENDING);
        
        return swapRequestRepository.save(request);
    }

    public ScheduleSwapRequest approveSwap(Long requestId, String approver) {
        return swapRequestRepository.findById(requestId).map(request -> {
            request.setStatus(ScheduleSwapRequest.SwapStatus.APPROVED);
            request.setApprovedBy(approver);
            request.setApprovedAt(java.time.LocalDateTime.now());
            
            NurseSchedule from = request.getFromSchedule();
            NurseSchedule to = request.getToSchedule();
            
            Nurse tempNurse = from.getNurse();
            LocalDate tempDate = from.getScheduleDate();
            NurseSchedule.ShiftType tempShift = from.getShift();
            
            from.setNurse(to.getNurse());
            from.setScheduleDate(to.getScheduleDate());
            from.setShift(to.getShift());
            
            to.setNurse(tempNurse);
            to.setScheduleDate(tempDate);
            to.setShift(tempShift);
            
            scheduleRepository.save(from);
            scheduleRepository.save(to);
            
            return swapRequestRepository.save(request);
        }).orElseThrow(() -> new RuntimeException("Swap request not found"));
    }

    public List<ScheduleSwapRequest> getPendingSwapRequests() {
        return swapRequestRepository.findByStatus(ScheduleSwapRequest.SwapStatus.PENDING);
    }

    public ScheduleValidationService.ValidationResult getIcuCoverageValidation(LocalDate date) {
        return validationService.validateIcuNurseCoverage(date);
    }
}
