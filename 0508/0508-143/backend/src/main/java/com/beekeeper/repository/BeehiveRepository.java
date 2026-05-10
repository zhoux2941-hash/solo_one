package com.beekeeper.repository;

import com.beekeeper.entity.Beehive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BeehiveRepository extends JpaRepository<Beehive, Long> {
    Optional<Beehive> findByHiveNumber(String hiveNumber);
    boolean existsByHiveNumber(String hiveNumber);
}
