package com.express.station.repository;

import com.express.station.entity.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParcelRepository extends JpaRepository<Parcel, Long> {
    
    Optional<Parcel> findByParcelNo(String parcelNo);
    
    Optional<Parcel> findByPickupCode(String pickupCode);
    
    List<Parcel> findByAllocationBatchId(String allocationBatchId);
    
    @Query("SELECT p FROM Parcel p WHERE p.shelfRow IS NOT NULL AND p.shelfCol IS NOT NULL AND (p.pickedUp = false OR p.pickedUp IS NULL)")
    List<Parcel> findAllAllocatedParcels();
    
    List<Parcel> findByShelfRowAndShelfColAndPickedUpIsFalse(Integer shelfRow, Integer shelfCol);
    
    boolean existsByParcelNo(String parcelNo);
    
    boolean existsByPickupCode(String pickupCode);
}
