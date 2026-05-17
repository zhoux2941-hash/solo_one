package com.water.repository;

import com.water.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByPhone(String phone);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    Page<User> findAll(Pageable pageable);
}
