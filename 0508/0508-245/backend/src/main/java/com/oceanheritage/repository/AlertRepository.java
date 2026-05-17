package com.oceanheritage.repository;

import com.oceanheritage.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByShipMmsiAndStatus(String shipMmsi, Alert.AlertStatus status);

    List<Alert> findByStatus(Alert.AlertStatus status);

    @Query("SELECT a.shipMmsi, COUNT(a) FROM Alert a GROUP BY a.shipMmsi ORDER BY COUNT(a) DESC")
    List<Object[]> countByShipMmsi();

    @Query("SELECT a.lng, a.lat, COUNT(a) FROM Alert a GROUP BY a.lng, a.lat")
    List<Object[]> getHeatmapData();
}
