package com.bookdrift.repository;

import com.bookdrift.entity.Drift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriftRepository extends JpaRepository<Drift, Long> {

    List<Drift> findByRequesterId(Long requesterId);

    List<Drift> findByOwnerId(Long ownerId);

    List<Drift> findByBookId(Long bookId);

    Optional<Drift> findByBookIdAndStatus(Long bookId, String status);

    @Query("SELECT d FROM Drift d WHERE d.bookId = ?1 AND d.status = 'DRIFTING'")
    Optional<Drift> findActiveDriftByBookId(Long bookId);

    @Query("SELECT d FROM Drift d WHERE d.requesterId = ?1 AND d.status = 'DRIFTING'")
    List<Drift> findActiveDriftsByRequesterId(Long requesterId);

    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Drift d WHERE d.bookId = ?1 AND d.requesterId = ?2 AND d.status IN ('PENDING', 'DRIFTING')")
    boolean existsPendingOrActiveDrift(Long bookId, Long requesterId);

    @Query("SELECT COUNT(d) FROM Drift d WHERE d.bookId = ?1 AND d.status != 'REJECTED'")
    int countByBookId(Long bookId);
}
