package com.meteor.repository;

import com.meteor.entity.ObservationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationSessionRepository extends JpaRepository<ObservationSession, Long> {
    List<ObservationSession> findByMeteorShowerNameOrderByStartTimeDesc(String meteorShowerName);

    List<ObservationSession> findByUserNameOrderByStartTimeDesc(String userName);

    @Query("SELECT o FROM ObservationSession o WHERE o.status = 'ACTIVE' ORDER BY o.startTime DESC")
    List<ObservationSession> findActiveSessions();

    @Query("SELECT o FROM ObservationSession o WHERE o.meteorShowerName = :showerName AND o.radiantConstellation IS NOT NULL ORDER BY o.startTime DESC")
    List<ObservationSession> findCompletedSessionsByShowerName(@Param("showerName") String showerName);

    @Query("SELECT COUNT(o) FROM ObservationSession o WHERE o.meteorShowerName = :showerName")
    Long countByShowerName(@Param("showerName") String showerName);
}
