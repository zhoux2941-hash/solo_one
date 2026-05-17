package com.office.platform.repository;

import com.office.platform.entity.Position;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    List<Position> findByEnabledTrue();

    @Query("SELECT p FROM Position p WHERE " +
           "(:name IS NULL OR p.name LIKE %:name%) AND " +
           "(:level IS NULL OR p.level = :level) AND " +
           "(:departmentId IS NULL OR p.department.id = :departmentId)")
    Page<Position> findByConditions(@Param("name") String name,
                                    @Param("level") String level,
                                    @Param("departmentId") Long departmentId,
                                    Pageable pageable);

    List<Position> findByDepartmentId(Long departmentId);

    long countByDepartmentId(Long departmentId);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}
