package com.logistics.track.repository;

import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    
    List<Track> findByPackageIdOrderByTimestampAsc(Long packageId);
    
    List<Track> findByPackageIdOrderByTimestampDesc(Long packageId);
    
    Page<Track> findByPackageIdOrderByTimestampDesc(Long packageId, Pageable pageable);
    
    List<Track> findByPackageIdAndStatusOrderByTimestampAsc(Long packageId, TrackStatus status);
    
    @Query("SELECT t FROM Track t WHERE t.packageId = :packageId ORDER BY t.timestamp DESC")
    List<Track> findLatestByPackageId(@Param("packageId") Long packageId, Pageable pageable);
    
    @Query("SELECT t FROM Track t WHERE t.status = :status AND t.timestamp <= :cutoffTime AND NOT EXISTS " +
           "(SELECT t2 FROM Track t2 WHERE t2.packageId = t.packageId AND t2.timestamp > t.timestamp)")
    List<Track> findStuckPackages(@Param("status") TrackStatus status, @Param("cutoffTime") LocalDateTime cutoffTime);
    
    @Query("SELECT FUNCTION('DATE', t.timestamp) as date, COUNT(DISTINCT t.packageId) as count " +
           "FROM Track t WHERE t.status = 'PICKUP' GROUP BY FUNCTION('DATE', t.timestamp) ORDER BY date")
    List<Object[]> countPickupByDate();
    
    @Query("SELECT FUNCTION('DATE', t.timestamp) as date, COUNT(DISTINCT t.packageId) as count " +
           "FROM Track t WHERE t.status = 'SIGNED' GROUP BY FUNCTION('DATE', t.timestamp) ORDER BY date")
    List<Object[]> countSignedByDate();

    @Query("SELECT t FROM Track t WHERE t.packageId IN :packageIds ORDER BY t.packageId, t.timestamp")
    List<Track> findByPackageIds(@Param("packageIds") List<Long> packageIds);

    @Query("SELECT t FROM Track t WHERE t.packageId IN :packageIds AND t.status IN :statuses ORDER BY t.packageId, t.timestamp")
    List<Track> findByPackageIdsAndStatuses(@Param("packageIds") List<Long> packageIds, @Param("statuses") List<TrackStatus> statuses);

    @Query("SELECT DISTINCT t.packageId FROM Track t WHERE t.status = 'PICKUP'")
    List<Long> findAllPackageIds();
}
