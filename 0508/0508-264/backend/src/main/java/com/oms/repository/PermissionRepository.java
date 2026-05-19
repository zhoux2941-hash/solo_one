package com.oms.repository;

import com.oms.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByParentId(Long parentId);
    List<Permission> findByType(Permission.PermissionType type);

    /**
     * 根据角色ID查询权限列表
     */
    @Query("SELECT p FROM Permission p JOIN p.roles r WHERE r.id = :roleId")
    List<Permission> findByRoleId(@Param("roleId") Long roleId);

    /**
     * 根据用户ID查询权限列表
     */
    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.id = :userId")
    List<Permission> findByUserId(@Param("userId") Long userId);
}
