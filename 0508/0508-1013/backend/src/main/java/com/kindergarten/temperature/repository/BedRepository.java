package com.kindergarten.temperature.repository;

import com.kindergarten.temperature.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    Optional<Bed> findByBedNo(Integer bedNo);
    boolean existsByBedNo(Integer bedNo);
}
