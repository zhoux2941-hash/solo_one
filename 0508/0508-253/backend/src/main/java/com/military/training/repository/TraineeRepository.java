package com.military.training.repository;

import com.military.training.entity.Trainee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraineeRepository extends JpaRepository<Trainee, Long> {
    List<Trainee> findByPlatoon(String platoon);
    List<Trainee> findBySquad(String squad);
    boolean existsByEmployeeId(String employeeId);
    Trainee findByEmployeeId(String employeeId);
}