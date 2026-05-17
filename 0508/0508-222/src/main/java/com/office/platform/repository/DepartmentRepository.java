package com.office.platform.repository;

import com.office.platform.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Page<Department> findByNameContaining(String name, Pageable pageable);

    List<Department> findByEnabled(Boolean enabled);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}