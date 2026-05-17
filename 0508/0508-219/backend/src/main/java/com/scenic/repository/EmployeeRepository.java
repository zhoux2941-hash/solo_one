package com.scenic.repository;

import com.scenic.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmpNo(String empNo);

    List<Employee> findByDepartmentId(Long departmentId);

    List<Employee> findByPositionId(Long positionId);

    List<Employee> findByStatus(String status);

    boolean existsByEmpNo(String empNo);

    boolean existsByIdCard(String idCard);
}
