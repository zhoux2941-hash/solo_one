package com.park.benchstats.repository;

import com.park.benchstats.entity.Bench;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BenchRepository extends JpaRepository<Bench, Long> {
    List<Bench> findByArea(String area);
    Bench findByBenchCode(String benchCode);
}
