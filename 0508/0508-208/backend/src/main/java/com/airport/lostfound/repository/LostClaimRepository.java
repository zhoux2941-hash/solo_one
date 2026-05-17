package com.airport.lostfound.repository;

import com.airport.lostfound.model.LostClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LostClaimRepository extends JpaRepository<LostClaim, Long> {

    List<LostClaim> findByStatus(String status);
}
