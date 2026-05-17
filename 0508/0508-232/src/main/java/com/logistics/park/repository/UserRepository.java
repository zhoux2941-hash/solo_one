package com.logistics.park.repository;

import com.logistics.park.entity.Role;
import com.logistics.park.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByNameContaining(String name, Pageable pageable);
    Page<User> findByRoleAndNameContaining(Role role, String name, Pageable pageable);
}
