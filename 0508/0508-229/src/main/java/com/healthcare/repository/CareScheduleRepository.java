package com.healthcare.repository;

import com.healthcare.entity.CareSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CareScheduleRepository extends JpaRepository<CareSchedule, Long>, JpaSpecificationExecutor<CareSchedule> {
    boolean existsByScheduleNo(String scheduleNo);
    boolean existsByScheduleNoAndIdNot(String scheduleNo, Long id);
    List<CareSchedule> findByElderIdAndScheduleDate(Long elderId, LocalDate scheduleDate);
    List<CareSchedule> findByCaregiverIdAndScheduleDate(Long caregiverId, LocalDate scheduleDate);
    List<CareSchedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);
}
