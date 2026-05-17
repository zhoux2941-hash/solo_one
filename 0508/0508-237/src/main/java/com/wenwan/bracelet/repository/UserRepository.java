package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameAndPassword(String username, String password);

    List<User> findByRole(User.UserRole role);

    List<User> findByRoleAndCraftsmanStatus(User.UserRole role, User.CraftsmanStatus status);

    boolean existsByUsername(String username);
}