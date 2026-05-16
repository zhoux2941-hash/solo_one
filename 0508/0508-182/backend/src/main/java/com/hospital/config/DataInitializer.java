package com.hospital.config;

import com.hospital.entity.Bed;
import com.hospital.entity.Nurse;
import com.hospital.entity.NurseSchedule;
import com.hospital.repository.BedRepository;
import com.hospital.repository.NurseRepository;
import com.hospital.repository.NurseScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private NurseRepository nurseRepository;

    @Autowired
    private NurseScheduleRepository scheduleRepository;

    @Override
    public void run(String... args) {
        for (int i = 1; i <= 10; i++) {
            Bed bed = new Bed();
            bed.setBedNumber("N-" + String.format("%02d", i));
            bed.setType(Bed.BedType.NORMAL);
            bed.setStatus(Bed.BedStatus.AVAILABLE);
            bedRepository.save(bed);
        }

        for (int i = 1; i <= 4; i++) {
            Bed bed = new Bed();
            bed.setBedNumber("I-" + String.format("%02d", i));
            bed.setType(Bed.BedType.ICU);
            bed.setStatus(Bed.BedStatus.AVAILABLE);
            bedRepository.save(bed);
        }

        String[] nurseNames = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"};
        Nurse[] nurses = new Nurse[nurseNames.length];

        for (int i = 0; i < nurseNames.length; i++) {
            Nurse nurse = new Nurse();
            nurse.setName(nurseNames[i]);
            nurse.setEmployeeId("NURSE-" + String.format("%03d", i + 1));
            nurse.setIcuQualified(i < 4);
            nurses[i] = nurseRepository.save(nurse);
        }

        LocalDate today = LocalDate.now();
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.plusDays(i);
            for (int j = 0; j < 3; j++) {
                NurseSchedule schedule = new NurseSchedule();
                schedule.setNurse(nurses[j]);
                schedule.setScheduleDate(date);
                schedule.setShift(NurseSchedule.ShiftType.values()[j % 3]);
                scheduleRepository.save(schedule);
            }
        }
    }
}
