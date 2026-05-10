package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    @Query("SELECT m FROM Match m WHERE m.intentA.user.id = :userId OR m.intentB.user.id = :userId")
    List<Match> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT m FROM Match m WHERE (m.intentA.user.id = :userId OR m.intentB.user.id = :userId) AND m.status = :status")
    List<Match> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    @Query("SELECT m FROM Match m WHERE (m.intentA.user.id = :userId OR m.intentB.user.id = :userId)")
    Page<Match> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(m) > 0 FROM Match m WHERE " +
           "(m.intentA.id = :intentAId AND m.intentB.id = :intentBId) OR " +
           "(m.intentA.id = :intentBId AND m.intentB.id = :intentAId)")
    boolean existsByIntents(@Param("intentAId") Long intentAId, @Param("intentBId") Long intentBId);
}
