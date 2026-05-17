package com.water.repository;

import com.water.entity.PipeNetwork;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PipeNetworkRepository extends JpaRepository<PipeNetwork, Long> {
    Page<PipeNetwork> findByStationId(Long stationId, Pageable pageable);
    Page<PipeNetwork> findByActive(Boolean active, Pageable pageable);
    Page<PipeNetwork> findByStationIdAndActive(Long stationId, Boolean active, Pageable pageable);
}
