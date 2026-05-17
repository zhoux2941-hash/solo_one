package com.prison.call.repository;

import com.prison.call.entity.Inmate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InmateRepository extends JpaRepository<Inmate, Long> {
    Optional<Inmate> findByInmateNo(String inmateNo);
    List<Inmate> findByPrisonArea(String prisonArea);
}
