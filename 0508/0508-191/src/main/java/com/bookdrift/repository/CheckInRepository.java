package com.bookdrift.repository;

import com.bookdrift.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    List<CheckIn> findByDriftIdOrderByCheckinDateDesc(Long driftId);

    List<CheckIn> findByBookIdOrderByCheckinDateDesc(Long bookId);

    List<CheckIn> findByUserIdOrderByCheckinDateDesc(Long userId);

    Optional<CheckIn> findByDriftIdAndCheckinDate(Long driftId, LocalDate checkinDate);

    int countByBookId(Long bookId);

    @Query("SELECT AVG(c.progress) FROM CheckIn c WHERE c.bookId = ?1")
    Double avgProgressByBookId(Long bookId);

    @Query("SELECT SUM(c.pagesRead) FROM CheckIn c WHERE c.driftId = ?1")
    Integer sumPagesReadByDriftId(Long driftId);
}
