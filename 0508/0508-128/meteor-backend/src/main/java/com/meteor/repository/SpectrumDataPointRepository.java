package com.meteor.repository;

import com.meteor.entity.SpectrumDataPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpectrumDataPointRepository extends JpaRepository<SpectrumDataPoint, Long> {
    List<SpectrumDataPoint> findByMeteorSpectraIdOrderByPixelIndexAsc(Long spectraId);
    void deleteByMeteorSpectraId(Long spectraId);
}
