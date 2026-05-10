package com.meteor.repository;

import com.meteor.entity.MeteorShower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeteorShowerRepository extends JpaRepository<MeteorShower, Long> {
    Optional<MeteorShower> findByCode(String code);

    List<MeteorShower> findByYear(Integer year);

    @Query("SELECT m FROM MeteorShower m WHERE m.isHot = true ORDER BY m.peakTime DESC")
    List<MeteorShower> findHotShowers();

    List<MeteorShower> findAllByOrderByPeakTimeDesc();
}
