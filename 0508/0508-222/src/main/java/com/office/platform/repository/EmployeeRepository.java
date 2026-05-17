package com.office.platform.repository;

import com.office.platform.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Employee findByUserId(Long userId);

    List<Employee> findByPositionId(Long positionId);

    long countByPositionId(Long positionId);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:name IS NULL OR e.name LIKE %:name%) AND " +
           "(:departmentId IS NULL OR e.department.id = :departmentId) AND " +
           "(:positionId IS NULL OR e.position.id = :positionId)")
    Page<Employee> findByConditions(@Param("name") String name,
                                    @Param("departmentId") Long departmentId,
                                    @Param("positionId") Long positionId,
                                    Pageable pageable);

    boolean existsByIdCard(String idCard);

    boolean existsByIdCardAndIdNot(String idCard, Long id);

    List<Employee> findByDepartmentId(Long departmentId);

    long countByDepartmentId(Long departmentId);
}
