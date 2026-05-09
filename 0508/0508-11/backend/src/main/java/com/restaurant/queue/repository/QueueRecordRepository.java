package com.restaurant.queue.repository;

import com.restaurant.queue.entity.QueueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QueueRecordRepository extends JpaRepository<QueueRecord, Long> {

    List<QueueRecord> findByStatusInOrderByEnqueueTimeAsc(List<QueueRecord.QueueStatus> statuses);

    List<QueueRecord> findByStatusOrderByEnqueueTimeAsc(QueueRecord.QueueStatus status);

    @Query("SELECT q FROM QueueRecord q WHERE q.status IN :statuses ORDER BY q.enqueueTime ASC")
    List<QueueRecord> findActiveQueues(@Param("statuses") List<QueueRecord.QueueStatus> statuses);

    List<QueueRecord> findByRestaurantIdAndStatusInOrderByEnqueueTimeAsc(
            Long restaurantId, List<QueueRecord.QueueStatus> statuses);

    List<QueueRecord> findByRestaurantIdAndStatusOrderByEnqueueTimeAsc(
            Long restaurantId, QueueRecord.QueueStatus status);

    @Query("SELECT DISTINCT q.restaurantId FROM QueueRecord q")
    List<Long> findAllRestaurantIds();

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.status = 'COMPLETED' " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationMinutes();

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.status = 'COMPLETED' " +
           "AND q.partySize <= 2 " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationForSmallTables();

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.status = 'COMPLETED' " +
           "AND q.partySize > 2 " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationForMediumTables();

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.status = 'COMPLETED' " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationMinutesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.status = 'COMPLETED' " +
           "AND q.partySize <= 2 " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationForSmallTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, q.callTime, q.completeTime)) " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.status = 'COMPLETED' " +
           "AND q.partySize > 2 " +
           "AND q.callTime IS NOT NULL AND q.completeTime IS NOT NULL")
    Double findAverageMealDurationForMediumTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT FUNCTION('HOUR', q.enqueueTime) as hour, COUNT(q) as count " +
           "FROM QueueRecord q WHERE q.enqueueTime >= :startTime GROUP BY FUNCTION('HOUR', q.enqueueTime)")
    List<Object[]> countByHour(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('HOUR', q.enqueueTime) as hour, COUNT(q) as count " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.enqueueTime >= :startTime GROUP BY FUNCTION('HOUR', q.enqueueTime)")
    List<Object[]> countByHourAndRestaurant(@Param("restaurantId") Long restaurantId, 
                                             @Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('HOUR', q.enqueueTime) as hour, " +
           "AVG(TIMESTAMPDIFF(MINUTE, q.enqueueTime, COALESCE(q.callTime, q.enqueueTime))) as avgWait " +
           "FROM QueueRecord q WHERE q.enqueueTime >= :startTime " +
           "GROUP BY FUNCTION('HOUR', q.enqueueTime)")
    List<Object[]> avgWaitTimeByHour(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('HOUR', q.enqueueTime) as hour, " +
           "AVG(TIMESTAMPDIFF(MINUTE, q.enqueueTime, COALESCE(q.callTime, q.enqueueTime))) as avgWait " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.enqueueTime >= :startTime " +
           "GROUP BY FUNCTION('HOUR', q.enqueueTime)")
    List<Object[]> avgWaitTimeByHourAndRestaurant(@Param("restaurantId") Long restaurantId,
                                                   @Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('HOUR', q.completeTime) as hour, COUNT(q) as count " +
           "FROM QueueRecord q WHERE q.status = 'COMPLETED' " +
           "AND q.completeTime >= :startTime " +
           "GROUP BY FUNCTION('HOUR', q.completeTime)")
    List<Object[]> countCompletedByHour(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT FUNCTION('HOUR', q.completeTime) as hour, COUNT(q) as count " +
           "FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.status = 'COMPLETED' " +
           "AND q.completeTime >= :startTime " +
           "GROUP BY FUNCTION('HOUR', q.completeTime)")
    List<Object[]> countCompletedByHourAndRestaurant(@Param("restaurantId") Long restaurantId,
                                                      @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.partySize <= 2 AND q.status = 'COMPLETED'")
    Long countCompletedSmallTables();

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.partySize > 2 AND q.status = 'COMPLETED'")
    Long countCompletedMediumTables();

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.partySize <= 2 AND q.status = 'COMPLETED'")
    Long countCompletedSmallTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.partySize > 2 AND q.status = 'COMPLETED'")
    Long countCompletedMediumTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.status IN ('WAITING', 'CALLED')")
    Long countActiveQueues();

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.partySize <= 2 AND q.status IN ('WAITING', 'CALLED')")
    Long countActiveSmallQueues();

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.partySize > 2 AND q.status IN ('WAITING', 'CALLED')")
    Long countActiveMediumQueues();

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.status IN ('WAITING', 'CALLED')")
    Long countActiveQueuesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.partySize <= 2 AND q.status IN ('WAITING', 'CALLED')")
    Long countActiveSmallQueuesByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(q) FROM QueueRecord q WHERE q.restaurantId = :restaurantId " +
           "AND q.partySize > 2 AND q.status IN ('WAITING', 'CALLED')")
    Long countActiveMediumQueuesByRestaurant(@Param("restaurantId") Long restaurantId);
}
