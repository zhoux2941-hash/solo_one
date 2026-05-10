package com.fishing.repository;

import com.fishing.entity.Lure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LureRepository extends JpaRepository<Lure, Long> {
    Optional<Lure> findByModelAndColor(String model, String color);
}
