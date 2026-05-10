package com.lightpollution.repository;

import com.lightpollution.entity.ChallengeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ChallengeLogRepository extends JpaRepository<ChallengeLog, Long> {
    
    List<ChallengeLog> findByChallengeIdOrderByLogDateDesc(Long challengeId);
    
    long countByChallengeId(Long challengeId);
    
    boolean existsByChallengeIdAndLogDate(Long challengeId, LocalDate logDate);
}
