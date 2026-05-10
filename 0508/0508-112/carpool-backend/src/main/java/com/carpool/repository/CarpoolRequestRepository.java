package com.carpool.repository;

import com.carpool.entity.CarpoolRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarpoolRequestRepository extends JpaRepository<CarpoolRequest, Long> {

    List<CarpoolRequest> findByTripIdOrderByCreatedAtDesc(Long tripId);

    List<CarpoolRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<CarpoolRequest> findByTripIdAndStatusOrderByCreatedAtDesc(Long tripId, String status);

    @Query("SELECT cr FROM CarpoolRequest cr JOIN cr.trip t " +
           "WHERE t.publisher.id = :publisherId AND cr.status = :status " +
           "ORDER BY cr.createdAt DESC")
    List<CarpoolRequest> findByTripPublisherAndStatus(
            @Param("publisherId") Long publisherId,
            @Param("status") String status
    );

    Optional<CarpoolRequest> findByTripIdAndRequesterId(Long tripId, Long requesterId);

    boolean existsByTripIdAndRequesterId(Long tripId, Long requesterId);

    boolean existsByTripIdAndRequesterIdAndStatusIn(Long tripId, Long requesterId, List<String> statuses);
}
