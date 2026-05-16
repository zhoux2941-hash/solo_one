package com.hospital.repository;

import com.hospital.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByType(Bed.BedType type);
    List<Bed> findByStatus(Bed.BedStatus status);
    
    @Query("SELECT COUNT(b) FROM Bed b WHERE b.type = 'ICU' AND b.status = 'OCCUPIED'")
    long countOccupiedIcuBeds();
}
