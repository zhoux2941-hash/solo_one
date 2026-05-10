package com.beekeeper.repository;

import com.beekeeper.entity.NectarSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NectarSourceRepository extends JpaRepository<NectarSource, Long> {
    List<NectarSource> findByActiveTrue();
    List<NectarSource> findBySeason(String season);
}
