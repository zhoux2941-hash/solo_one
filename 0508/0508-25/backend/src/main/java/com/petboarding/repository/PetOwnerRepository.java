package com.petboarding.repository;

import com.petboarding.entity.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PetOwnerRepository extends JpaRepository<PetOwner, Long> {
    Optional<PetOwner> findByPhone(String phone);
    Optional<PetOwner> findByEmail(String email);
}
