package com.carpool.repository;

import com.carpool.entity.CarpoolGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarpoolGroupRepository extends JpaRepository<CarpoolGroup, Long> {

    Optional<CarpoolGroup> findByTripId(Long tripId);

    List<CarpoolGroup> findByLeaderIdOrderByCreatedAtDesc(Long leaderId);

    @Query("SELECT DISTINCT cg FROM CarpoolGroup cg " +
           "LEFT JOIN cg.members m " +
           "WHERE cg.leader.id = :userId OR m.id = :userId " +
           "ORDER BY cg.createdAt DESC")
    List<CarpoolGroup> findByUserId(@Param("userId") Long userId);

    boolean existsByTripId(Long tripId);
}
