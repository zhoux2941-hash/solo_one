package com.scenic.repository;

import com.scenic.entity.Venue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {

    Optional<Venue> findByVenueCode(String venueCode);

    @Query("SELECT v FROM Venue v WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR v.venueCode LIKE %:keyword% OR v.venueName LIKE %:keyword%) AND " +
           "(:status IS NULL OR :status = '' OR v.status = :status) AND " +
           "(:venueType IS NULL OR :venueType = '' OR v.venueType = :venueType)")
    Page<Venue> findByConditions(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("venueType") String venueType,
            Pageable pageable);

    List<Venue> findByStatus(String status);

    boolean existsByVenueCode(String venueCode);
}
