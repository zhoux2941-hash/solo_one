package com.quiz.repository;

import com.quiz.entity.AudienceVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudienceVoteRepository extends JpaRepository<AudienceVote, Long> {

    List<AudienceVote> findByCompetitionId(Long competitionId);

    @Query("SELECT v.teamId, COUNT(v) FROM AudienceVote v WHERE v.competitionId = :competitionId GROUP BY v.teamId")
    List<Object[]> countVotesByCompetitionGroupByTeam(@Param("competitionId") Long competitionId);

    @Query("SELECT v.teamId, SUM(v.points) FROM AudienceVote v WHERE v.competitionId = :competitionId GROUP BY v.teamId")
    List<Object[]> sumPointsByCompetitionGroupByTeam(@Param("competitionId") Long competitionId);

    @Query("SELECT COUNT(v) FROM AudienceVote v WHERE v.competitionId = :competitionId AND v.audienceSession = :session AND v.createdAt >= :recentTime")
    long countRecentVotesBySession(@Param("competitionId") Long competitionId,
                                    @Param("session") String session,
                                    @Param("recentTime") java.time.LocalDateTime recentTime);

    @Query("SELECT v.teamId, COUNT(v) as cnt FROM AudienceVote v WHERE v.competitionId = :competitionId GROUP BY v.teamId ORDER BY cnt DESC")
    List<Object[]> findVoteRankingByCompetition(@Param("competitionId") Long competitionId);
}
