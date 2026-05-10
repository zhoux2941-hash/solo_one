package com.meteor.repository;

import com.meteor.entity.EmissionLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmissionLineRepository extends JpaRepository<EmissionLine, Long> {
    List<EmissionLine> findByMeteorSpectraId(Long spectraId);
    void deleteByMeteorSpectraId(Long spectraId);
}
