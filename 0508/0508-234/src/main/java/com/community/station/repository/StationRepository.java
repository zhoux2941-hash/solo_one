package com.community.station.repository;

import com.community.station.entity.Station;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    List<Station> findByStationNameContaining(String stationName);

    Page<Station> findByStationNameContaining(String stationName, Pageable pageable);

    List<Station> findByGoverningCommunity(String governingCommunity);

    Page<Station> findAll(Pageable pageable);
}
