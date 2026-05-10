package com.lightpollution.repository;

import com.lightpollution.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    
    List<Challenge> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<Challenge> findByUserIdAndStatus(Long userId, String status);
    
    List<Challenge> findByUserId(Long userId);
    
    List<Challenge> findByStatus(String status);
}
