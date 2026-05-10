package com.flower.preservative.repository;

import com.flower.preservative.entity.Flower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FlowerRepository extends JpaRepository<Flower, Long> {
    Optional<Flower> findByFlowerType(String flowerType);
}
