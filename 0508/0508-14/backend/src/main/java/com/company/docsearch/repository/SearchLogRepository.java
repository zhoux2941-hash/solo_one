package com.company.docsearch.repository;

import com.company.docsearch.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {

    @Query("SELECT s.keyword, COUNT(s) as cnt FROM SearchLog s GROUP BY s.keyword ORDER BY cnt DESC")
    List<Object[]> countByKeyword();

    @Query("SELECT s FROM SearchLog s WHERE s.timestamp >= :startTime ORDER BY s.timestamp ASC")
    List<SearchLog> findLogsSince(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT s FROM SearchLog s WHERE s.timestamp >= :startTime AND s.resultCount = 0 ORDER BY s.timestamp ASC")
    List<SearchLog> findNoResultLogsSince(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT s FROM SearchLog s WHERE s.clickedDocId IS NOT NULL AND s.timestamp >= :startTime")
    List<SearchLog> findClickedLogsSince(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('DATE_FORMAT', s.timestamp, '%Y-%m-%d %H:00') as hour, COUNT(s) as cnt " +
           "FROM SearchLog s WHERE s.timestamp >= :startTime GROUP BY hour ORDER BY hour ASC")
    List<Object[]> countByHourSince(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(s) FROM SearchLog s WHERE s.timestamp >= :startTime AND s.resultCount = 0")
    Long countNoResultSince(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(s) FROM SearchLog s WHERE s.timestamp >= :startTime")
    Long countTotalSince(@Param("startTime") LocalDateTime startTime);
}
