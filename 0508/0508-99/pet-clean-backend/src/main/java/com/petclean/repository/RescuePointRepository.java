package com.petclean.repository;

import com.petclean.entity.RescuePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RescuePointRepository extends JpaRepository<RescuePoint, Long> {

    List<RescuePoint> findByStatusOrderByCreatedAtDesc(String status);

    List<RescuePoint> findAllByOrderByCreatedAtDesc();

    List<RescuePoint> findByReportedByOrderByCreatedAtDesc(Long userId);

    List<RescuePoint> findByRescuedByOrderByCreatedAtDesc(Long userId);
}
