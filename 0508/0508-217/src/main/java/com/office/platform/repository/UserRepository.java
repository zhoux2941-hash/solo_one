package com.office.platform.repository;

import com.office.platform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByUsername(String username);

    Page<User> findByUsernameContainingOrRealNameContaining(String username, String realName, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:username IS NULL OR u.username LIKE %:username%) AND " +
           "(:realName IS NULL OR u.realName LIKE %:realName%) AND " +
           "(:departmentId IS NULL OR u.department.id = :departmentId)")
    Page<User> findByConditions(@Param("username") String username,
                                @Param("realName") String realName,
                                @Param("departmentId") Long departmentId,
                                Pageable pageable);

    List<User> findByDepartmentId(Long departmentId);

    long countByDepartmentId(Long departmentId);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);
}