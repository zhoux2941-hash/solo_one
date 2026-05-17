package com.airport.lostfound.repository;

import com.airport.lostfound.model.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {

    List<FoundItem> findByStatus(String status);

    @Query("SELECT f FROM FoundItem f WHERE f.status = '待认领' AND f.foundDate >= :date")
    List<FoundItem> findRecentItems(@Param("date") LocalDate date);

    @Query("SELECT f FROM FoundItem f WHERE f.status = '待认领'")
    List<FoundItem> findAllUnclaimed();
}
