package com.swimming.lanematcher.repository;

import com.swimming.lanematcher.entity.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {
    List<UserFeedback> findByActualLaneId(Integer laneId);

    @Query("SELECT f.actualLaneId, COUNT(f) FROM UserFeedback f GROUP BY f.actualLaneId ORDER BY COUNT(f) DESC")
    List<Object[]> countByActualLaneId();

    @Query("SELECT f FROM UserFeedback f ORDER BY f.createdAt DESC")
    List<UserFeedback> findAllOrderByCreatedAtDesc();
}