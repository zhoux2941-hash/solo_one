package com.museum.humidity.repository;

import com.museum.humidity.entity.DisplayCabinet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DisplayCabinetRepository extends JpaRepository<DisplayCabinet, Long> {
    Optional<DisplayCabinet> findByCabinetNumber(String cabinetNumber);
    boolean existsByCabinetNumber(String cabinetNumber);
}
