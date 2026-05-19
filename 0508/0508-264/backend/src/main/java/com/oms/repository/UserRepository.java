package com.oms.repository;

import com.oms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    List<User> findByTenantId(Long tenantId);
    boolean existsByUsername(String username);

    /**
     * 根据角色ID查询拥有该角色的所有用户ID
     */
    @Query("SELECT u.id FROM User u JOIN u.roles r WHERE r.id = :roleId")
    List<Long> findUserIdsByRoleId(@Param("roleId") Long roleId);
}
