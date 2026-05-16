package com.hospital.service;

import com.hospital.entity.NurseSchedule;
import com.hospital.repository.BedRepository;
import com.hospital.repository.NurseScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@Service
public class ScheduleValidationService {
    @Autowired
    private NurseScheduleRepository scheduleRepository;

    @Autowired
    private BedRepository bedRepository;

    public boolean canScheduleNurse(Long nurseId, LocalDate date) {
        LocalDate startOfWeek = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        long count = scheduleRepository.countSchedulesInWeek(nurseId, startOfWeek, endOfWeek);
        return count < 5;
    }

    public ValidationResult validateIcuNurseCoverage(LocalDate date) {
        long occupiedIcuBeds = bedRepository.countOccupiedIcuBeds();
        long icuNursesOnDuty = scheduleRepository.countIcuNursesOnDate(date);
        
        double requiredNurses = Math.ceil(occupiedIcuBeds / 2.0);
        boolean isValid = icuNursesOnDuty >= requiredNurses;
        
        return new ValidationResult(
            isValid,
            (int) occupiedIcuBeds,
            (int) icuNursesOnDuty,
            (int) requiredNurses
        );
    }

    public static class ValidationResult {
        private final boolean valid;
        private final int occupiedIcuBeds;
        private final int icuNursesOnDuty;
        private final int requiredNurses;

        public ValidationResult(boolean valid, int occupiedIcuBeds, int icuNursesOnDuty, int requiredNurses) {
            this.valid = valid;
            this.occupiedIcuBeds = occupiedIcuBeds;
            this.icuNursesOnDuty = icuNursesOnDuty;
            this.requiredNurses = requiredNurses;
        }

        public boolean isValid() { return valid; }
        public int getOccupiedIcuBeds() { return occupiedIcuBeds; }
        public int getIcuNursesOnDuty() { return icuNursesOnDuty; }
        public int getRequiredNurses() { return requiredNurses; }
    }
}
