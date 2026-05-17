package com.scenic.repository;

import com.scenic.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long>, JpaSpecificationExecutor<Department> {

    Optional<Department> findByDeptCode(String deptCode);

    Optional<Department> findByDeptName(String deptName);

    List<Department> findByStatus(Boolean status);

    boolean existsByDeptCode(String deptCode);

    boolean existsByDeptName(String deptName);
}
