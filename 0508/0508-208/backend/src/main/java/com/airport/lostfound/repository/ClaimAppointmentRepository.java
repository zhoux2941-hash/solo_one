package com.airport.lostfound.repository;

import com.airport.lostfound.model.ClaimAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimAppointmentRepository extends JpaRepository<ClaimAppointment, Long> {

    List<ClaimAppointment> findByStatus(String status);

    List<ClaimAppointment> findByFoundItemId(Long foundItemId);
}
