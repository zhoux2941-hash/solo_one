package com.community.station.repository;

import com.community.station.entity.Resident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Long> {

    Optional<Resident> findByPhone(String phone);

    List<Resident> findByBuildingNumber(String buildingNumber);

    List<Resident> findByEnabled(Boolean enabled);

    Page<Resident> findAll(Pageable pageable);
}
