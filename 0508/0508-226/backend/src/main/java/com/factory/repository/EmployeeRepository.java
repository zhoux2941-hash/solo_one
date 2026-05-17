package com.factory.repository;

import com.factory.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeNo(String employeeNo);
    boolean existsByEmployeeNo(String employeeNo);
    List<Employee> findByTeamId(Long teamId);
    Page<Employee> findByEmployeeNameContaining(String employeeName, Pageable pageable);
}