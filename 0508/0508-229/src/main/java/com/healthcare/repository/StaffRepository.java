package com.healthcare.repository;

import com.healthcare.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long>, JpaSpecificationExecutor<Staff> {
    boolean existsByStaffNo(String staffNo);
    boolean existsByStaffNoAndIdNot(String staffNo, Long id);
}